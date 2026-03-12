import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { Check, FileText } from "lucide-react";

interface PdfRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: PdfRequestData) => void;
    title?: string;
}

export interface PdfRequestData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export function PdfRequestModal({ isOpen, onClose, onGenerate, title = "PDF anfordern" }: PdfRequestModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (acceptedPrivacy) {
            onGenerate({ firstName, lastName, email, phone });
            onClose();
        }
    };

    const isValid = firstName && lastName && email && phone && acceptedPrivacy;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Vorname"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Max"
                        required
                    />
                    <Input
                        label="Nachname"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Mustermann"
                        required
                    />
                </div>

                <Input
                    label="E-Mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="max@beispiel.de"
                    required
                />

                <Input
                    label="Telefonnummer"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 123 456789"
                    required
                />

                <div className="flex items-start gap-3 pt-2">
                    <div className="flex bg-gray-50 rounded-lg p-3 border border-gray-100 w-full">
                        <input
                            type="checkbox"
                            id="privacy-check"
                            checked={acceptedPrivacy}
                            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                            className="mt-1 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="privacy-check" className="ml-3 text-sm text-gray-600 cursor-pointer select-none">
                            Ich akzeptiere die <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>Datenschutzverordnung</a>.
                        </label>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full justify-center py-3 text-base"
                        disabled={!isValid}
                        variant="primary"
                    >
                        <FileText className="w-5 h-5 mr-2" />
                        PDF generieren
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
