import { useMenuFactory } from "@/hooks/use-menu-factory";

export function useSharedMenu() {
  const { showMenu } = useMenuFactory();

  // 显示右键菜单
  const showContextMenu = async () => {
    await showMenu({ type: "context" });
  };

  return {
    showContextMenu
  };
}
