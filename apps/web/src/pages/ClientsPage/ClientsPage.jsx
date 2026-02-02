import "./ClientsPage.css";
import ClientsSection from "../../components/ClientsSection/ClientsSection.jsx";

export default function ClientsPage({
  isActive,
  clients,
  clientForm,
  onClientFormChange,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) {
  if (!isActive) return null;

  return (
    <section className="clients-page">
      <div className="clients-page__content">
        <ClientsSection
          clients={clients}
          clientForm={clientForm}
          onClientFormChange={onClientFormChange}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
        />
      </div>
    </section>
  );
}
