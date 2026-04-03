import { apiFetch } from '../../lib/api.js';

const EMPTY_DESIGN = { boxes: [], cables: [], devices: [] };

const readBlobAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const parseErrorMessage = async (response) => {
  try {
    const errBody = await response.json();
    return errBody?.message || errBody?.error || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
};

const resolveBaseProjectData = async ({ baseProjectId, baseVersionId, authToken }) => {
  const [designRes, versionsRes, attachmentsRes] = await Promise.all([
    apiFetch(`/api/projects/${baseProjectId}/design`, {}, authToken),
    apiFetch(`/api/projects/${baseProjectId}/versions`, {}, authToken),
    apiFetch(`/api/projects/${baseProjectId}/attachments`, {}, authToken),
  ]);

  const designData = designRes.ok ? await designRes.json() : { design: null };
  const versionsData = versionsRes.ok ? await versionsRes.json() : { versions: [] };
  const attachmentsData = attachmentsRes.ok ? await attachmentsRes.json() : { items: [] };

  let initialDesign = EMPTY_DESIGN;
  let baseVersionMeta = null;

  if (baseVersionId && Array.isArray(versionsData?.versions)) {
    baseVersionMeta = versionsData.versions.find((version) => version.id === baseVersionId) || null;
    if (baseVersionMeta?.snapshot?.design) {
      initialDesign = baseVersionMeta.snapshot.design;
    }
  }

  if (!baseVersionMeta && designData?.design) {
    initialDesign = designData.design;
  }

  return {
    initialDesign,
    baseVersionMeta,
    attachments: Array.isArray(attachmentsData?.items) ? attachmentsData.items : [],
  };
};

const cloneAttachments = async ({ baseProjectId, targetProjectId, attachments, authToken }) => {
  for (const attachment of attachments) {
    const fileRes = await apiFetch(
      `/api/projects/${baseProjectId}/attachments/${attachment.id}`,
      {},
      authToken
    );
    if (!fileRes.ok) continue;

    const blob = await fileRes.blob();
    const dataUrl = await readBlobAsDataUrl(blob);

    await apiFetch(
      `/api/projects/${targetProjectId}/attachments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: attachment.name,
            type: attachment.mime_type || attachment.type,
            size: attachment.size || blob.size,
            dataUrl,
          }],
        }),
      },
      authToken
    );
  }
};

export async function createProjectRecord({ payload, apiEnabled, authToken }) {
  const baseProjectId = payload?.baseProjectId || null;
  const baseVersionId = payload?.baseVersionId || null;

  if (!apiEnabled) {
    const id = `local-${Date.now()}`;
    return {
      mode: 'local',
      createdProject: {
        id,
        name: payload.name || 'Proyecto local',
        status: payload.status || 'draft',
        createdAt: new Date().toISOString(),
        design: payload.design || null,
      },
      createdVersion: null,
    };
  }

  const cleanedPayload = { ...payload };
  delete cleanedPayload.baseProjectId;
  delete cleanedPayload.baseVersionId;

  const createRes = await apiFetch(
    '/api/projects',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedPayload),
    },
    authToken
  );

  if (!createRes.ok) {
    const message = await parseErrorMessage(createRes);
    throw new Error(message);
  }

  const created = await createRes.json();
  let initialDesign = EMPTY_DESIGN;
  let baseVersionMeta = null;

  if (baseProjectId) {
    const baseData = await resolveBaseProjectData({ baseProjectId, baseVersionId, authToken });
    initialDesign = baseData.initialDesign;
    baseVersionMeta = baseData.baseVersionMeta;

    if (baseData.attachments.length > 0) {
      await cloneAttachments({
        baseProjectId,
        targetProjectId: created.id,
        attachments: baseData.attachments,
        authToken,
      });
    }
  }

  if (initialDesign) {
    await apiFetch(
      `/api/projects/${created.id}/design`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design: initialDesign }),
      },
      authToken
    );
  }

  const versionRes = await apiFetch(
    `/api/projects/${created.id}/versions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshot: { design: initialDesign, createdAt: new Date().toISOString() },
        name: baseVersionMeta?.name || 'Versión 1',
        notes: baseVersionMeta?.notes || null,
        status: baseVersionMeta?.status || 'draft',
        locked: false,
        author: baseVersionMeta?.author || null,
      }),
    },
    authToken
  );

  const createdVersion = versionRes.ok ? await versionRes.json() : null;

  return {
    mode: 'api',
    createdProject: { ...created, versions_count: 1 },
    createdVersion,
  };
}
