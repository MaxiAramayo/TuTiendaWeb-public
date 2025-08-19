import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import Image from "next/image";

interface Props {
  children: React.ReactNode;
  btnText?: string;
  title?: string;
  subtitle: string;
  open: boolean;
  icon?: string;
  contentClassName?: string;
  btnClassName?: string;
  setOpen: (open: boolean) => void;
}

const DialogC = ({
  children,
  title,
  subtitle,
  open,
  setOpen,
  btnText,
  icon,
  btnClassName,
  contentClassName
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={btnClassName}>
          {icon && <Image src={icon} width={16} height={16} alt="" />}
          <span className="w-[90px] font-bold">{btnText}</span>
        </button>
      </DialogTrigger>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default DialogC;
