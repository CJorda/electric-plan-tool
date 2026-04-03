import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import {
  ensureAuthTables,
  ensureCatalogTables,
  ensureDatabase,
  ensureOperationsTables,
  ensureProjectAttachmentsTable,
  ensureProjectsTable,
  query,
} from "../src/db.js";

dotenv.config({ path: ".env" });

const ids = {
  users: {
    admin: "10000000-0000-4000-8000-000000000001",
  },
  providers: {
    electroMax: "20000000-0000-4000-8000-000000000001",
    cableNet: "20000000-0000-4000-8000-000000000002",
    secureSupply: "20000000-0000-4000-8000-000000000003",
  },
  manufacturers: {
    hikvision: "30000000-0000-4000-8000-000000000001",
    dahua: "30000000-0000-4000-8000-000000000002",
    ajax: "30000000-0000-4000-8000-000000000003",
  },
  categories: {
    security: "40000000-0000-4000-8000-000000000001",
    cameras: "40000000-0000-4000-8000-000000000002",
    recording: "40000000-0000-4000-8000-000000000003",
    cabling: "40000000-0000-4000-8000-000000000004",
    accessories: "40000000-0000-4000-8000-000000000005",
  },
  products: {
    cameraTurret2mp: "50000000-0000-4000-8000-000000000001",
    cameraBullet4mp: "50000000-0000-4000-8000-000000000002",
    nvr8ch: "50000000-0000-4000-8000-000000000003",
    cat6Roll: "50000000-0000-4000-8000-000000000004",
    poeSwitch: "50000000-0000-4000-8000-000000000005",
    monitor22: "50000000-0000-4000-8000-000000000006",
  },
  catalogTemplates: {
    residencial: "60000000-0000-4000-8000-000000000001",
    comercial: "60000000-0000-4000-8000-000000000002",
  },
  projects: {
    almacenes: "70000000-0000-4000-8000-000000000001",
    oficinas: "70000000-0000-4000-8000-000000000002",
    residencial: "70000000-0000-4000-8000-000000000003",
    parking: "70000000-0000-4000-8000-000000000004",
  },
  attachments: {
    manual: "71000000-0000-4000-8000-000000000001",
  },
  operations: {
    inventory1: "80000000-0000-4000-8000-000000000001",
    inventory2: "80000000-0000-4000-8000-000000000002",
    purchase1: "80000000-0000-4000-8000-000000000003",
    purchase2: "80000000-0000-4000-8000-000000000004",
    report1: "80000000-0000-4000-8000-000000000005",
    report2: "80000000-0000-4000-8000-000000000006",
    approval1: "80000000-0000-4000-8000-000000000007",
    approval2: "80000000-0000-4000-8000-000000000008",
    planning1: "80000000-0000-4000-8000-000000000009",
    planning2: "80000000-0000-4000-8000-000000000010",
    labor1: "80000000-0000-4000-8000-000000000011",
    labor2: "80000000-0000-4000-8000-000000000012",
    template1: "80000000-0000-4000-8000-000000000013",
    template2: "80000000-0000-4000-8000-000000000014",
    audit1: "80000000-0000-4000-8000-000000000015",
    audit2: "80000000-0000-4000-8000-000000000016",
    integration1: "80000000-0000-4000-8000-000000000017",
    integration2: "80000000-0000-4000-8000-000000000018",
    setting1: "80000000-0000-4000-8000-000000000019",
    setting2: "80000000-0000-4000-8000-000000000020",
  },
};

const productDistributorPriceIds = {
  [ids.products.cameraTurret2mp]: "51000000-0000-4000-8000-000000000001",
  [ids.products.cameraBullet4mp]: "51000000-0000-4000-8000-000000000002",
  [ids.products.nvr8ch]: "51000000-0000-4000-8000-000000000003",
  [ids.products.cat6Roll]: "51000000-0000-4000-8000-000000000004",
  [ids.products.poeSwitch]: "51000000-0000-4000-8000-000000000005",
  [ids.products.monitor22]: "51000000-0000-4000-8000-000000000006",
};

const productPriceHistoryIds = {
  [ids.products.cameraTurret2mp]: "52000000-0000-4000-8000-000000000001",
  [ids.products.cameraBullet4mp]: "52000000-0000-4000-8000-000000000002",
  [ids.products.nvr8ch]: "52000000-0000-4000-8000-000000000003",
  [ids.products.cat6Roll]: "52000000-0000-4000-8000-000000000004",
  [ids.products.poeSwitch]: "52000000-0000-4000-8000-000000000005",
  [ids.products.monitor22]: "52000000-0000-4000-8000-000000000006",
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const toDateOnly = (days) => daysAgo(days).slice(0, 10);

const createProjectDesign = ({
  cameraCount,
  cameraModel,
  cableModel,
  cableSection,
  cableLength,
}) => {
  const cameraUnit = cameraModel === "Camara Bullet 4MP" ? 119 : 79;
  const cableUnit = 0.72;
  const boxA = {
    id: "box-a",
    name: "Rack principal",
    x: 120,
    y: 140,
    width: 180,
    height: 120,
    components: [
      {
        id: "cmp-nvr",
        category: "Grabacion",
        model: "NVR 8 Canales PoE",
        quantity: 1,
        unitPrice: 329,
        customerDiscountPercent: 0,
        discountApplied: false,
        productActive: true,
        total: 329,
      },
      {
        id: "cmp-switch",
        category: "Accesorios",
        model: "Switch PoE 8P",
        quantity: 1,
        unitPrice: 139,
        customerDiscountPercent: 0,
        discountApplied: false,
        productActive: true,
        total: 139,
      },
    ],
  };

  const boxB = {
    id: "box-b",
    name: "Control",
    x: 520,
    y: 220,
    width: 160,
    height: 100,
    components: [
      {
        id: "cmp-monitor",
        category: "Accesorios",
        model: 'Monitor 22" Vigilancia',
        quantity: 1,
        unitPrice: 149,
        customerDiscountPercent: 0,
        discountApplied: false,
        productActive: true,
        total: 149,
      },
    ],
  };

  const devices = Array.from({ length: cameraCount }).map((_, index) => ({
    id: `dev-${index + 1}`,
    category: "Camaras",
    model: cameraModel,
    quantity: 1,
    unitPrice: cameraUnit,
    customerDiscountPercent: 0,
    discountApplied: false,
    productActive: true,
    total: cameraUnit,
    x: 250 + index * 80,
    y: 420,
  }));

  return {
    boxes: [boxA, boxB],
    cables: [
      {
        id: "cable-main",
        fromBoxId: "box-a",
        toBoxId: "box-b",
        model: cableModel,
        section: cableSection,
        length: cableLength,
        totalPrice: Number((cableLength * cableUnit).toFixed(2)),
      },
    ],
    devices,
  };
};

const ensureProjectColumns = async () => {
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS client TEXT");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS reference TEXT");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS versions JSONB");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS design JSONB");
};

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash("admin", 10);
  await query(
    `
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW()
    `,
    [ids.users.admin, "admin@admin.com", passwordHash, "Admin", "admin"]
  );
};

const seedCatalog = async () => {
  const providers = [
    {
      id: ids.providers.electroMax,
      name: "ElectroMax Distribuciones",
      contactName: "Lucia Gomez",
      email: "compras@electromax.local",
      phone: "+34 910 111 222",
      website: "https://electromax.local",
      notes: "Proveedor principal de CCTV",
    },
    {
      id: ids.providers.cableNet,
      name: "CableNet Pro",
      contactName: "Mario Ruiz",
      email: "pedidos@cablenet.local",
      phone: "+34 910 333 444",
      website: "https://cablenet.local",
      notes: "Especialista en cableado y conectica",
    },
    {
      id: ids.providers.secureSupply,
      name: "Secure Supply",
      contactName: "Nora Vega",
      email: "sales@securesupply.local",
      phone: "+34 910 555 666",
      website: "https://securesupply.local",
      notes: "Stock rapido en seguridad",
    },
  ];

  for (const provider of providers) {
    await query(
      `
        INSERT INTO providers (id, name, contact_name, email, phone, website, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (name)
        DO UPDATE SET
          contact_name = EXCLUDED.contact_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          website = EXCLUDED.website,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `,
      [
        provider.id,
        provider.name,
        provider.contactName,
        provider.email,
        provider.phone,
        provider.website,
        provider.notes,
      ]
    );
  }

  const manufacturers = [
    {
      id: ids.manufacturers.hikvision,
      name: "Hikvision",
      contactName: "Canal Iberia",
      email: "partner@hikvision.local",
      phone: "+34 911 010 101",
      website: "https://hikvision.local",
      notes: "Linea profesional",
    },
    {
      id: ids.manufacturers.dahua,
      name: "Dahua",
      contactName: "Canal Dahua",
      email: "partner@dahua.local",
      phone: "+34 911 202 202",
      website: "https://dahua.local",
      notes: "Videoanalitica",
    },
    {
      id: ids.manufacturers.ajax,
      name: "Ajax",
      contactName: "Soporte Ajax",
      email: "partner@ajax.local",
      phone: "+34 911 303 303",
      website: "https://ajax.local",
      notes: "Intrusion y automatizacion",
    },
  ];

  for (const manufacturer of manufacturers) {
    await query(
      `
        INSERT INTO manufacturers (id, name, contact_name, email, phone, website, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (name)
        DO UPDATE SET
          contact_name = EXCLUDED.contact_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          website = EXCLUDED.website,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `,
      [
        manufacturer.id,
        manufacturer.name,
        manufacturer.contactName,
        manufacturer.email,
        manufacturer.phone,
        manufacturer.website,
        manufacturer.notes,
      ]
    );
  }

  const categories = [
    {
      id: ids.categories.security,
      name: "Seguridad",
      description: "Categoria raiz para soluciones de seguridad",
      parentId: null,
    },
    {
      id: ids.categories.cameras,
      name: "Camaras",
      description: "Camaras IP y analogicas",
      parentId: ids.categories.security,
    },
    {
      id: ids.categories.recording,
      name: "Grabacion",
      description: "NVR, DVR y almacenamiento",
      parentId: ids.categories.security,
    },
    {
      id: ids.categories.cabling,
      name: "Cableado",
      description: "Cables, conectores y accesorios de red",
      parentId: ids.categories.security,
    },
    {
      id: ids.categories.accessories,
      name: "Accesorios",
      description: "Switches, monitores y perifericos",
      parentId: ids.categories.security,
    },
  ];

  for (const category of categories) {
    await query(
      `
        INSERT INTO categories (id, name, description, parent_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name)
        DO UPDATE SET
          description = EXCLUDED.description,
          parent_id = EXCLUDED.parent_id,
          updated_at = NOW()
      `,
      [category.id, category.name, category.description, category.parentId]
    );
  }

  const products = [
    {
      id: ids.products.cameraTurret2mp,
      categoryId: ids.categories.cameras,
      name: "Camara Turret 2MP",
      manufacturer: "Hikvision",
      distributorId: ids.providers.electroMax,
      serial: "CAM-TUR-2MP",
      distributorPrice: 89,
      discountPrice: 79,
      shippingCost: 5,
      leadTime: "48h",
    },
    {
      id: ids.products.cameraBullet4mp,
      categoryId: ids.categories.cameras,
      name: "Camara Bullet 4MP",
      manufacturer: "Dahua",
      distributorId: ids.providers.secureSupply,
      serial: "CAM-BUL-4MP",
      distributorPrice: 129,
      discountPrice: 119,
      shippingCost: 6,
      leadTime: "72h",
    },
    {
      id: ids.products.nvr8ch,
      categoryId: ids.categories.recording,
      name: "NVR 8 Canales PoE",
      manufacturer: "Hikvision",
      distributorId: ids.providers.electroMax,
      serial: "NVR-8CH-POE",
      distributorPrice: 359,
      discountPrice: 329,
      shippingCost: 9,
      leadTime: "72h",
    },
    {
      id: ids.products.cat6Roll,
      categoryId: ids.categories.cabling,
      name: "Cable UTP Cat6 (305m)",
      manufacturer: "CableNet",
      distributorId: ids.providers.cableNet,
      serial: "CBL-CAT6-305",
      distributorPrice: 229,
      discountPrice: 219,
      shippingCost: 11,
      leadTime: "24h",
    },
    {
      id: ids.products.poeSwitch,
      categoryId: ids.categories.accessories,
      name: "Switch PoE 8P",
      manufacturer: "Ajax",
      distributorId: ids.providers.secureSupply,
      serial: "SWT-POE-8P",
      distributorPrice: 159,
      discountPrice: 139,
      shippingCost: 7,
      leadTime: "48h",
    },
    {
      id: ids.products.monitor22,
      categoryId: ids.categories.accessories,
      name: 'Monitor 22" Vigilancia',
      manufacturer: "Dahua",
      distributorId: ids.providers.electroMax,
      serial: "MON-22-CCTV",
      distributorPrice: 169,
      discountPrice: 149,
      shippingCost: 8,
      leadTime: "72h",
    },
  ];

  for (const product of products) {
    await query(
      `
        INSERT INTO products (
          id,
          category_id,
          name,
          manufacturer,
          distributor_id,
          serial,
          distributor_price,
          discount_price,
          shipping_cost,
          lead_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id)
        DO UPDATE SET
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          manufacturer = EXCLUDED.manufacturer,
          distributor_id = EXCLUDED.distributor_id,
          serial = EXCLUDED.serial,
          distributor_price = EXCLUDED.distributor_price,
          discount_price = EXCLUDED.discount_price,
          shipping_cost = EXCLUDED.shipping_cost,
          lead_time = EXCLUDED.lead_time,
          updated_at = NOW()
      `,
      [
        product.id,
        product.categoryId,
        product.name,
        product.manufacturer,
        product.distributorId,
        product.serial,
        product.distributorPrice,
        product.discountPrice,
        product.shippingCost,
        product.leadTime,
      ]
    );

    await query(
      `
        INSERT INTO product_distributor_prices (
          id,
          product_id,
          distributor_id,
          distributor_price,
          discount_price,
          shipping_cost,
          lead_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (product_id, distributor_id)
        DO UPDATE SET
          distributor_price = EXCLUDED.distributor_price,
          discount_price = EXCLUDED.discount_price,
          shipping_cost = EXCLUDED.shipping_cost,
          lead_time = EXCLUDED.lead_time,
          updated_at = NOW()
      `,
      [
        productDistributorPriceIds[product.id],
        product.id,
        product.distributorId,
        product.distributorPrice,
        product.discountPrice,
        product.shippingCost,
        product.leadTime,
      ]
    );

    await query(
      `
        INSERT INTO product_price_history (
          id,
          product_id,
          distributor_id,
          distributor_price,
          discount_price,
          shipping_cost,
          currency,
          note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id)
        DO NOTHING
      `,
      [
        productPriceHistoryIds[product.id],
        product.id,
        product.distributorId,
        product.distributorPrice,
        product.discountPrice,
        product.shippingCost,
        "EUR",
        "Carga demo",
      ]
    );
  }

  const margins = [
    { id: "61000000-0000-4000-8000-000000000001", categoryId: ids.categories.cameras, providerId: ids.providers.electroMax, marginPercent: 22 },
    { id: "61000000-0000-4000-8000-000000000002", categoryId: ids.categories.recording, providerId: ids.providers.electroMax, marginPercent: 18 },
    { id: "61000000-0000-4000-8000-000000000003", categoryId: ids.categories.cabling, providerId: ids.providers.cableNet, marginPercent: 16 },
    { id: "61000000-0000-4000-8000-000000000004", categoryId: ids.categories.accessories, providerId: ids.providers.secureSupply, marginPercent: 20 },
  ];

  for (const margin of margins) {
    await query(
      `
        INSERT INTO category_provider_margins (id, category_id, provider_id, margin_percent)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (category_id, provider_id)
        DO UPDATE SET
          margin_percent = EXCLUDED.margin_percent,
          updated_at = NOW()
      `,
      [margin.id, margin.categoryId, margin.providerId, margin.marginPercent]
    );
  }

  const catalogTemplates = [
    {
      id: ids.catalogTemplates.residencial,
      name: "Plantilla residencial",
      description: "Margenes recomendados para proyectos de vivienda",
    },
    {
      id: ids.catalogTemplates.comercial,
      name: "Plantilla comercial",
      description: "Margenes para instalacion de tiendas y oficinas",
    },
  ];

  for (const template of catalogTemplates) {
    await query(
      `
        INSERT INTO price_templates (id, name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (name)
        DO UPDATE SET
          description = EXCLUDED.description,
          updated_at = NOW()
      `,
      [template.id, template.name, template.description]
    );
  }

  const templateMargins = [
    {
      id: "62000000-0000-4000-8000-000000000001",
      templateId: ids.catalogTemplates.residencial,
      categoryId: ids.categories.cameras,
      marginPercent: 24,
    },
    {
      id: "62000000-0000-4000-8000-000000000002",
      templateId: ids.catalogTemplates.residencial,
      categoryId: ids.categories.cabling,
      marginPercent: 17,
    },
    {
      id: "62000000-0000-4000-8000-000000000003",
      templateId: ids.catalogTemplates.comercial,
      categoryId: ids.categories.cameras,
      marginPercent: 28,
    },
    {
      id: "62000000-0000-4000-8000-000000000004",
      templateId: ids.catalogTemplates.comercial,
      categoryId: ids.categories.recording,
      marginPercent: 21,
    },
  ];

  for (const templateMargin of templateMargins) {
    await query(
      `
        INSERT INTO template_category_margins (id, template_id, category_id, margin_percent)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (template_id, category_id)
        DO UPDATE SET
          margin_percent = EXCLUDED.margin_percent,
          updated_at = NOW()
      `,
      [
        templateMargin.id,
        templateMargin.templateId,
        templateMargin.categoryId,
        templateMargin.marginPercent,
      ]
    );
  }
};

const seedProjects = async () => {
  const projects = [
    {
      id: ids.projects.almacenes,
      name: "Almacenes Norte",
      type: "CCTV",
      client: "Logistica Norte SL",
      reference: "AN-2026-001",
      address: "Poligono La Vega, Nave 14",
      notes: "Cobertura de andenes y acceso principal",
      status: "confirmed",
      createdAt: daysAgo(25),
      updatedAt: daysAgo(2),
      design: createProjectDesign({
        cameraCount: 6,
        cameraModel: "Camara Bullet 4MP",
        cableModel: "Cable UTP Cat6 (305m)",
        cableSection: "Cat6",
        cableLength: 85,
      }),
      versions: [
        {
          id: "73000000-0000-4000-8000-000000000001",
          name: "V1 - Relevamiento",
          notes: "Version inicial",
          status: "draft",
          locked: false,
          author: "admin@admin.com",
          createdAt: daysAgo(25),
          snapshot: {
            design: createProjectDesign({
              cameraCount: 4,
              cameraModel: "Camara Turret 2MP",
              cableModel: "Cable UTP Cat6 (305m)",
              cableSection: "Cat6",
              cableLength: 62,
            }),
          },
        },
        {
          id: "73000000-0000-4000-8000-000000000002",
          name: "V2 - Aprobada",
          notes: "Ajuste final de cobertura",
          status: "approved",
          locked: true,
          author: "admin@admin.com",
          createdAt: daysAgo(10),
          snapshot: {
            design: createProjectDesign({
              cameraCount: 6,
              cameraModel: "Camara Bullet 4MP",
              cableModel: "Cable UTP Cat6 (305m)",
              cableSection: "Cat6",
              cableLength: 85,
            }),
          },
        },
      ],
    },
    {
      id: ids.projects.oficinas,
      name: "Oficinas Central",
      type: "Control de accesos",
      client: "Grupo Delta",
      reference: "OC-2026-014",
      address: "Av. Europa 120",
      notes: "Integracion con recepcion",
      status: "draft",
      createdAt: daysAgo(18),
      updatedAt: daysAgo(3),
      design: createProjectDesign({
        cameraCount: 4,
        cameraModel: "Camara Turret 2MP",
        cableModel: "Cable UTP Cat6 (305m)",
        cableSection: "Cat6",
        cableLength: 58,
      }),
      versions: [
        {
          id: "73000000-0000-4000-8000-000000000003",
          name: "V1 - Base",
          notes: "En analisis interno",
          status: "draft",
          locked: false,
          author: "admin@admin.com",
          createdAt: daysAgo(18),
          snapshot: {
            design: createProjectDesign({
              cameraCount: 3,
              cameraModel: "Camara Turret 2MP",
              cableModel: "Cable UTP Cat6 (305m)",
              cableSection: "Cat6",
              cableLength: 44,
            }),
          },
        },
      ],
    },
    {
      id: ids.projects.residencial,
      name: "Residencial Sol 8",
      type: "Videoportero",
      client: "Comunidad Sol 8",
      reference: "RS8-2026-007",
      address: "Calle Sol 8",
      notes: "Modernizacion de sistema existente",
      status: "published",
      createdAt: daysAgo(42),
      updatedAt: daysAgo(5),
      design: createProjectDesign({
        cameraCount: 3,
        cameraModel: "Camara Turret 2MP",
        cableModel: "Cable UTP Cat6 (305m)",
        cableSection: "Cat6",
        cableLength: 36,
      }),
      versions: [
        {
          id: "73000000-0000-4000-8000-000000000004",
          name: "Publicada",
          notes: "Version comercial enviada",
          status: "published",
          locked: true,
          author: "admin@admin.com",
          createdAt: daysAgo(30),
          snapshot: {
            design: createProjectDesign({
              cameraCount: 3,
              cameraModel: "Camara Turret 2MP",
              cableModel: "Cable UTP Cat6 (305m)",
              cableSection: "Cat6",
              cableLength: 36,
            }),
          },
        },
      ],
    },
    {
      id: ids.projects.parking,
      name: "Parking Centro",
      type: "LPR",
      client: "Parking Centro SA",
      reference: "PK-2026-022",
      address: "Plaza Mayor 2",
      notes: "Lectura de matriculas en entradas",
      status: "archived",
      createdAt: daysAgo(80),
      updatedAt: daysAgo(33),
      design: createProjectDesign({
        cameraCount: 2,
        cameraModel: "Camara Bullet 4MP",
        cableModel: "Cable UTP Cat6 (305m)",
        cableSection: "Cat6",
        cableLength: 28,
      }),
      versions: [
        {
          id: "73000000-0000-4000-8000-000000000005",
          name: "Historica",
          notes: "Proyecto cerrado",
          status: "archived",
          locked: true,
          author: "admin@admin.com",
          createdAt: daysAgo(70),
          snapshot: {
            design: createProjectDesign({
              cameraCount: 2,
              cameraModel: "Camara Bullet 4MP",
              cableModel: "Cable UTP Cat6 (305m)",
              cableSection: "Cat6",
              cableLength: 28,
            }),
          },
        },
      ],
    },
  ];

  for (const project of projects) {
    await query(
      `
        INSERT INTO projects (
          id,
          name,
          type,
          client,
          reference,
          address,
          notes,
          status,
          design,
          versions,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::jsonb,
          $10::jsonb,
          $11,
          $12
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          client = EXCLUDED.client,
          reference = EXCLUDED.reference,
          address = EXCLUDED.address,
          notes = EXCLUDED.notes,
          status = EXCLUDED.status,
          design = EXCLUDED.design,
          versions = EXCLUDED.versions,
          updated_at = EXCLUDED.updated_at
      `,
      [
        project.id,
        project.name,
        project.type,
        project.client,
        project.reference,
        project.address,
        project.notes,
        project.status,
        JSON.stringify(project.design),
        JSON.stringify(project.versions),
        project.createdAt,
        project.updatedAt,
      ]
    );
  }

  const attachmentData = Buffer.from(
    "Documento de alcance demo.\nIncluye cobertura por zonas y lista base de materiales.\n",
    "utf8"
  );

  await query(
    `
      INSERT INTO project_attachments (id, project_id, name, mime_type, size, data)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        mime_type = EXCLUDED.mime_type,
        size = EXCLUDED.size,
        data = EXCLUDED.data
    `,
    [
      ids.attachments.manual,
      ids.projects.almacenes,
      "alcance-demo.txt",
      "text/plain",
      attachmentData.length,
      attachmentData,
    ]
  );
};

const seedOperations = async () => {
  await query(
    `
      INSERT INTO inventory_items (
        id, sku, name, category, unit, min_stock, current_stock, cost_price, sale_price, location, notes
      ) VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11),
        ($12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (sku)
      DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        unit = EXCLUDED.unit,
        min_stock = EXCLUDED.min_stock,
        current_stock = EXCLUDED.current_stock,
        cost_price = EXCLUDED.cost_price,
        sale_price = EXCLUDED.sale_price,
        location = EXCLUDED.location,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `,
    [
      ids.operations.inventory1,
      "INV-CAM-001",
      "Camara Turret 2MP",
      "Camaras",
      "ud",
      5,
      18,
      62,
      79,
      "A1-R2",
      "Stock saludable",
      ids.operations.inventory2,
      "INV-CBL-002",
      "Cable UTP Cat6 (305m)",
      "Cableado",
      "rollo",
      2,
      6,
      180,
      219,
      "B3-R1",
      "Reponer en 2 semanas",
    ]
  );

  await query(
    `
      INSERT INTO purchase_orders (
        id, supplier, status, expected_date, total_amount, currency, notes
      ) VALUES
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id)
      DO UPDATE SET
        supplier = EXCLUDED.supplier,
        status = EXCLUDED.status,
        expected_date = EXCLUDED.expected_date,
        total_amount = EXCLUDED.total_amount,
        currency = EXCLUDED.currency,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `,
    [
      ids.operations.purchase1,
      "ElectroMax Distribuciones",
      "approved",
      toDateOnly(7),
      2480,
      "EUR",
      "Pedido de reposicion mensual",
      ids.operations.purchase2,
      "CableNet Pro",
      "requested",
      toDateOnly(12),
      1340,
      "EUR",
      "Compra de cable y conectores",
    ]
  );

  await query(
    `
      INSERT INTO saved_reports (
        id, name, type, filters, last_run_at
      ) VALUES
        ($1, $2, $3, $4::jsonb, $5),
        ($6, $7, $8, $9::jsonb, $10)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        filters = EXCLUDED.filters,
        last_run_at = EXCLUDED.last_run_at,
        updated_at = NOW()
    `,
    [
      ids.operations.report1,
      "Margen por categoria",
      "profitability",
      JSON.stringify({ categories: ["Camaras", "Grabacion"], period: "monthly" }),
      daysAgo(1),
      ids.operations.report2,
      "Riesgo de stock",
      "inventory",
      JSON.stringify({ minCoverageDays: 15 }),
      daysAgo(3),
    ]
  );

  await query(
    `
      INSERT INTO approvals (
        id, entity_type, entity_id, requested_by, status, approved_by, notes
      ) VALUES
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id)
      DO UPDATE SET
        entity_type = EXCLUDED.entity_type,
        entity_id = EXCLUDED.entity_id,
        requested_by = EXCLUDED.requested_by,
        status = EXCLUDED.status,
        approved_by = EXCLUDED.approved_by,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `,
    [
      ids.operations.approval1,
      "purchase_order",
      ids.operations.purchase1,
      "compras@electroplan.local",
      "approved",
      "gerencia@electroplan.local",
      "Aprobado por monto y urgencia",
      ids.operations.approval2,
      "project_quote",
      ids.projects.oficinas,
      "ventas@electroplan.local",
      "pending",
      null,
      "Esperando validacion del cliente",
    ]
  );

  await query(
    `
      INSERT INTO planning_tasks (
        id, title, project_id, assignee, start_date, due_date, priority, status, notes
      ) VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        project_id = EXCLUDED.project_id,
        assignee = EXCLUDED.assignee,
        start_date = EXCLUDED.start_date,
        due_date = EXCLUDED.due_date,
        priority = EXCLUDED.priority,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `,
    [
      ids.operations.planning1,
      "Instalacion de rack",
      ids.projects.almacenes,
      "Diego",
      toDateOnly(1),
      toDateOnly(-2),
      "high",
      "in_progress",
      "Coordinar ventana con operaciones del cliente",
      ids.operations.planning2,
      "Pruebas de grabacion",
      ids.projects.oficinas,
      "Paula",
      toDateOnly(3),
      toDateOnly(-1),
      "medium",
      "todo",
      "Preparar checklist final",
    ]
  );

  await query(
    `
      INSERT INTO labor_rates (
        id, role, hourly_rate, overtime_rate, active, notes
      ) VALUES
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12)
      ON CONFLICT (id)
      DO UPDATE SET
        role = EXCLUDED.role,
        hourly_rate = EXCLUDED.hourly_rate,
        overtime_rate = EXCLUDED.overtime_rate,
        active = EXCLUDED.active,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `,
    [
      ids.operations.labor1,
      "Tecnico instalador",
      32,
      45,
      true,
      "Tarifa base para instalaciones estandar",
      ids.operations.labor2,
      "Ingeniero de puesta en marcha",
      48,
      65,
      true,
      "Incluye configuracion avanzada",
    ]
  );

  await query(
    `
      INSERT INTO project_templates (
        id, name, description, default_type, default_status, template_data
      ) VALUES
        ($1, $2, $3, $4, $5, $6::jsonb),
        ($7, $8, $9, $10, $11, $12::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_type = EXCLUDED.default_type,
        default_status = EXCLUDED.default_status,
        template_data = EXCLUDED.template_data,
        updated_at = NOW()
    `,
    [
      ids.operations.template1,
      "Template CCTV PYME",
      "Proyecto tipo para oficinas pequenas",
      "CCTV",
      "draft",
      JSON.stringify({ cameras: 6, nvr: 1, switches: 1 }),
      ids.operations.template2,
      "Template Parking",
      "Base para control de accesos en parking",
      "LPR",
      "draft",
      JSON.stringify({ lprCameras: 2, barriers: 1, lanes: 2 }),
    ]
  );

  await query(
    `
      INSERT INTO audit_events (
        id, action, entity_type, entity_id, actor, severity, details
      ) VALUES
        ($1, $2, $3, $4, $5, $6, $7::jsonb),
        ($8, $9, $10, $11, $12, $13, $14::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET
        action = EXCLUDED.action,
        entity_type = EXCLUDED.entity_type,
        entity_id = EXCLUDED.entity_id,
        actor = EXCLUDED.actor,
        severity = EXCLUDED.severity,
        details = EXCLUDED.details
    `,
    [
      ids.operations.audit1,
      "seed_demo",
      "system",
      "initial-load",
      "admin@admin.com",
      "info",
      JSON.stringify({ message: "Carga de datos demo ejecutada" }),
      ids.operations.audit2,
      "project_sync",
      "projects",
      ids.projects.almacenes,
      "admin@admin.com",
      "warning",
      JSON.stringify({ message: "Sincronizacion parcial resuelta automaticamente" }),
    ]
  );

  await query(
    `
      INSERT INTO integrations (
        id, name, provider, base_url, api_key_masked, status, config, last_sync_at
      ) VALUES
        ($1, $2, $3, $4, $5, $6, $7::jsonb, $8),
        ($9, $10, $11, $12, $13, $14, $15::jsonb, $16)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        provider = EXCLUDED.provider,
        base_url = EXCLUDED.base_url,
        api_key_masked = EXCLUDED.api_key_masked,
        status = EXCLUDED.status,
        config = EXCLUDED.config,
        last_sync_at = EXCLUDED.last_sync_at,
        updated_at = NOW()
    `,
    [
      ids.operations.integration1,
      "CRM Comercial",
      "HubSpot",
      "https://api.hubspot.local/v1",
      "hubs-****-1122",
      "active",
      JSON.stringify({ syncContacts: true, syncDeals: true }),
      daysAgo(1),
      ids.operations.integration2,
      "Facturacion",
      "Holded",
      "https://api.holded.local/v1",
      "hold-****-7788",
      "inactive",
      JSON.stringify({ syncInvoices: false }),
      null,
    ]
  );

  await query(
    `
      INSERT INTO advanced_settings (
        id, setting_key, setting_value, scope
      ) VALUES
        ($1, $2, $3::jsonb, $4),
        ($5, $6, $7::jsonb, $8)
      ON CONFLICT (setting_key, scope)
      DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = NOW()
    `,
    [
      ids.operations.setting1,
      "notifications.email",
      JSON.stringify({ enabled: true, dailySummaryHour: 8 }),
      "global",
      ids.operations.setting2,
      "pricing.defaultMargin",
      JSON.stringify({ value: 22, currency: "EUR" }),
      "global",
    ]
  );
};

const getCount = async (tableName) => {
  const result = await query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
  return Number(result.rows[0]?.count || 0);
};

const main = async () => {
  await ensureDatabase();
  await ensureProjectsTable();
  await ensureProjectAttachmentsTable();
  await ensureCatalogTables();
  await ensureAuthTables();
  await ensureOperationsTables();
  await ensureProjectColumns();

  await query("BEGIN");
  try {
    await seedUsers();
    await seedCatalog();
    await seedProjects();
    await seedOperations();
    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }

  const [projects, categories, products, providers, clientsLikeProjects, inventory, purchases] =
    await Promise.all([
      getCount("projects"),
      getCount("categories"),
      getCount("products"),
      getCount("providers"),
      getCount("projects"),
      getCount("inventory_items"),
      getCount("purchase_orders"),
    ]);

  console.log("Demo seed completed.");
  console.log(`projects=${projects}`);
  console.log(`categories=${categories}`);
  console.log(`products=${products}`);
  console.log(`providers=${providers}`);
  console.log(`inventory=${inventory}`);
  console.log(`purchases=${purchases}`);
  console.log(`login=admin@admin.com / admin`);
  console.log(`clients_hint=${clientsLikeProjects} (clients are seeded in web localStorage)`);
};

main().catch((error) => {
  console.error("Demo seed failed:", error?.message || error);
  process.exit(1);
});
