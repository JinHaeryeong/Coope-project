import Image from "next/image";
import { FC } from "react"
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
}
const ImageModal: FC<ModalProps> = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <Image src={imageUrl} alt="Modal Image" width={500} height={500} />
                <button onClick={onClose} className="absolute top-10 right-10">Close</button>
            </div>
        </div>
    );

}

export default ImageModal;