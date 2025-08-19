"use client";

import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../drawer";

interface Props {
  children: React.ReactNode;
  btnText?: string;
  title: string;
  subtitle: string;
  open: boolean;
  icon?: string;
  btnClassName?: string;
  setOpen: (open: boolean) => void;
}

const DrawerC = ({
  children,
  title,
  subtitle,
  open,
  setOpen,
  btnText,
  icon,
  btnClassName,
}: Props) => {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className={btnClassName}>
          {icon && <Image src={icon} width={16} height={16} alt="" />}
          <span className="w-[90px] font-bold">{btnText}</span>
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-white flex flex-col fixed bottom-0 max-h-[90%] left-0 right-0 rounded-t-[10px]">
        <div className="mx-auto w-full overflow-y-scroll">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{subtitle}</DrawerDescription>
          </DrawerHeader>

          <div className="mb-5 w-[90%] mx-auto ">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DrawerC;
