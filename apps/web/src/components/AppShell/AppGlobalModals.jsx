import BoxModal from "../modals/BoxModal/BoxModal.jsx";
import CableModal from "../modals/CableModal/CableModal.jsx";
import ImageModal from "../modals/ImageModal/ImageModal.jsx";
import CameraModal from "../modals/CameraModal/CameraModal.jsx";
import ToastViewport from "../ui/ToastViewport.jsx";

export default function AppGlobalModals({
  isBoxModalOpen,
  selectedBox,
  componentForm,
  catalog,
  onCloseBoxModal,
  onUpdateBoxName,
  onUpdateBoxZone,
  onComponentFormChange,
  onAddComponent,
  onRemoveComponent,
  onDeleteBox,
  componentErrors,
  isBoxNameValid,
  isCameraModalOpen,
  selectedDevice,
  cameraCatalog,
  cameraCategoryKey,
  onCloseCameraModal,
  onUpdateDevice,
  onDeleteDevice,
  isCableModalOpen,
  cableForm,
  onCableFormChange,
  onCloseCableModal,
  onSaveCable,
  cableErrors,
  isImageModalOpen,
  backgroundImage,
  onCloseImageModal,
  onBackgroundUrlChange,
  onBackgroundFileChange,
}) {
  return (
    <>
      <BoxModal
        open={isBoxModalOpen}
        box={selectedBox}
        componentForm={componentForm}
        catalog={catalog}
        onClose={onCloseBoxModal}
        onNameChange={onUpdateBoxName}
        onZoneChange={onUpdateBoxZone}
        onComponentFormChange={onComponentFormChange}
        onAddComponent={onAddComponent}
        onRemoveComponent={onRemoveComponent}
        onDeleteBox={onDeleteBox}
        componentErrors={componentErrors}
        isNameValid={isBoxNameValid}
      />

      <CameraModal
        open={isCameraModalOpen}
        device={selectedDevice}
        catalog={cameraCatalog}
        categoryName={cameraCategoryKey || "Cámaras"}
        onClose={onCloseCameraModal}
        onUpdate={onUpdateDevice}
        onDelete={onDeleteDevice}
      />

      <CableModal
        open={isCableModalOpen}
        cableForm={cableForm}
        onChange={onCableFormChange}
        onClose={onCloseCableModal}
        onSave={onSaveCable}
        errors={cableErrors}
      />

      <ImageModal
        open={isImageModalOpen}
        backgroundImage={backgroundImage}
        onClose={onCloseImageModal}
        onUrlChange={onBackgroundUrlChange}
        onFileChange={onBackgroundFileChange}
      />

      <ToastViewport />
    </>
  );
}
