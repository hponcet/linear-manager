import { ReactNode } from "react";
import { Popover, Whisper, Menu as RSMenu } from "rsuite";
import { Button } from "../Button/Button";
import { MenuIcon } from "../Icons/MenuIcon";

export type MenuItem = {
  label: string;
  action: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  submenu?: MenuItem[];
};

export type MenuProps = {
  items: MenuItem[];
};

export function Menu(props: MenuProps) {
  const { items } = props;

  function renderMenu(
    { onClose, className, ...rest }: any,
    ref: React.Ref<any>,
  ) {
    return (
      <Popover ref={ref} className={className} {...rest} full>
        <RSMenu
          onSelect={(itemIndex: number) => {
            items[itemIndex]?.action?.();
            onClose();
          }}
        >
          {items.map((item, index) => (
            <RSMenu.Item
              key={index}
              eventKey={index}
              disabled={item.disabled}
              icon={item.icon as any}
            >
              {item.label}
            </RSMenu.Item>
          ))}
        </RSMenu>
      </Popover>
    );
  }

  return (
    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu}>
      <div>
        <Button>
          <MenuIcon />
        </Button>
      </div>
    </Whisper>
  );
}
