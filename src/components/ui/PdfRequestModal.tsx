import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { FileText } from "lucide-react";

interface PdfRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: PdfRequestData) => Promise<void> | void;
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
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acceptedPrivacy || isLoading) return;

        setIsLoading(true);
        try {
            await onGenerate({ firstName, lastName, email, phone });
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    const isValid = firstName && lastName && phone && acceptedPrivacy;

    return (
        <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Vorname"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Max"
                        required
                        disabled={isLoading}
                    />
                    <Input
                        label="Nachname"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Mustermann"
                        required
                        disabled={isLoading}
                    />
                </div>

                <Input
                    label="Telefonnummer"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 123 456789"
                    required
                    disabled={isLoading}
                />

                <Input
                    label="E-Mail (optional)"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="max@beispiel.de"
                    disabled={isLoading}
                />

                <div className="flex items-start gap-3 pt-2">
                    <div className="flex bg-gray-50 rounded-lg p-3 border border-gray-100 w-full">
                        <input
                            type="checkbox"
                            id="privacy-check"
                            checked={acceptedPrivacy}
                            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                            className="mt-1 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                            disabled={isLoading}
                        />
                        <label htmlFor="privacy-check" className="ml-3 text-sm text-gray-600 cursor-pointer select-none">
                            Ich akzeptiere die <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>Datenschutzerklärung</a>.
                        </label>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full justify-center py-3 text-base"
                        disabled={!isValid || isLoading}
                        variant="primary"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                PDF wird erstellt...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5 mr-2" />
                                PDF generieren
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
