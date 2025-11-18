export const Modal = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;
  return <div className="modal">Modal Content</div>;
};
