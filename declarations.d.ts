
declare module '@/utils/gerarEEnviar' {
  export default function gerarEEnviar(): Promise<any>;
  export { gerarEEnviar };
}

declare module '@/utils/html-to-pdf' {
  export const htmlToPdfAndUpload: (html: string, fileName: string) => Promise<string>;
}

declare module '@/utils/invoice/invoicePdfGenerator' {
  export const generateInvoicePdf: (invoiceId: string, invoiceNumber: string) => Promise<string>;
}

declare module '@/components/ui/calendar' {
  export interface CalendarProps {
    mode?: 'single';
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    initialFocus?: boolean;
  }
  export function Calendar(props: CalendarProps): JSX.Element;
}

declare module '@/components/ui/popover' {
  export function Popover({ children }: { children: React.ReactNode }): JSX.Element;
  export function PopoverTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }): JSX.Element;
  export function PopoverContent({ children, className }: { children: React.ReactNode; className?: string }): JSX.Element;
}
