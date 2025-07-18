import { _useMenuFactory } from "@/hooks/menu/_use-menu-factory";

export function useSharedMenu() {
  const { showMenu } = _useMenuFactory();

  // 显示右键菜单
  const showContextMenu = async () => {
    await showMenu({ type: "context" });
  };

  return {
    showContextMenu
  };
}
