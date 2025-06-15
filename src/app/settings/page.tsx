"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Slider,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Layout,
  Menu,
  Select,
  Input,
  Tag,
  Table,
  Modal,
  Form,
  Upload,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  GithubOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useCatStore } from "@/stores/catStore";
import { useModelStore } from "@/stores/modelStore";
import { useGeneralStore } from "@/stores/generalStore";
import { useShortcutStore } from "@/stores/shortcutStore";
import { useAppStore } from "@/stores/appStore";
import { useRouter } from "next/navigation";

const { Title, Text, Paragraph } = Typography;
const { Sider, Content } = Layout;
const { Option } = Select;

type TabKey = "cat" | "general" | "model" | "shortcut" | "about";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("cat");
  const [isShortcutModalVisible, setIsShortcutModalVisible] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<any>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  // Store hooks
  const catStore = useCatStore();
  const modelStore = useModelStore();
  const generalStore = useGeneralStore();
  const shortcutStore = useShortcutStore();
  const appStore = useAppStore();

  useEffect(() => {
    // Initialize models if empty
    if (modelStore.models.length === 0) {
      // 通过 modelStore 的 initializeModels 方法自动加载模型
      void modelStore.initializeModels();
    }
  }, []);

  const menuItems = [
    {
      key: "cat",
      icon: <EyeOutlined />,
      label: "猫咪设置",
    },
    {
      key: "general",
      icon: <SettingOutlined />,
      label: "通用设置",
    },
    {
      key: "model",
      icon: <AppstoreOutlined />,
      label: "模型管理",
    },
    {
      key: "shortcut",
      icon: <ThunderboltOutlined />,
      label: "快捷键",
    },
    {
      key: "about",
      icon: <InfoCircleOutlined />,
      label: "关于",
    },
  ];

  const handleShortcutEdit = (shortcut: any) => {
    setEditingShortcut(shortcut);
    form.setFieldsValue(shortcut);
    setIsShortcutModalVisible(true);
  };

  const handleShortcutSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingShortcut) {
        shortcutStore.updateShortcut(editingShortcut.id, values);
        message.success("快捷键更新成功");
      } else {
        shortcutStore.addShortcut({
          id: Date.now().toString(),
          ...values,
        });
        message.success("快捷键添加成功");
      }
      setIsShortcutModalVisible(false);
      setEditingShortcut(null);
      form.resetFields();
    } catch (error) {
      console.error("Failed to save shortcut:", error);
    }
  };

  const renderCatSettings = () => (
    <Space direction="vertical" size="large" className="w-full">
      <Card title="显示设置">
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong>可见性</Text>
            <div className="mt-2">
              <Switch
                checked={catStore.visible}
                onChange={catStore.setVisible}
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
            </div>
          </div>

          <div>
            <Text strong>透明度: {catStore.opacity}%</Text>
            <Slider
              min={10}
              max={100}
              value={catStore.opacity}
              onChange={catStore.setOpacity}
              className="mt-2"
            />
          </div>

          <div>
            <Text strong>缩放: {catStore.scale.toFixed(1)}x</Text>
            <Slider
              min={0.5}
              max={3.0}
              step={0.1}
              value={catStore.scale}
              onChange={catStore.setScale}
              className="mt-2"
            />
          </div>

          <div>
            <Text strong>镜像模式</Text>
            <div className="mt-2">
              <Switch
                checked={catStore.mirrorMode}
                onChange={catStore.setMirrorMode}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
          </div>
        </Space>
      </Card>

      <Card title="窗口设置">
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong>置顶显示</Text>
            <div className="mt-2">
              <Switch
                checked={catStore.alwaysOnTop}
                onChange={catStore.setAlwaysOnTop}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
          </div>

          <div>
            <Text strong>鼠标穿透</Text>
            <div className="mt-2">
              <Switch
                checked={catStore.penetrable}
                onChange={catStore.setPenetrable}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
            <Text type="secondary" className="text-xs">
              开启后鼠标点击将穿透猫咪窗口
            </Text>
          </div>

          <div>
            <Text strong>单一模式</Text>
            <div className="mt-2">
              <Switch
                checked={catStore.singleMode}
                onChange={catStore.setSingleMode}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
          </div>
        </Space>
      </Card>
    </Space>
  );

  const renderGeneralSettings = () => (
    <Space direction="vertical" size="large" className="w-full">
      <Card title="启动设置">
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong>开机自启</Text>
            <div className="mt-2">
              <Switch
                checked={generalStore.autostart}
                onChange={generalStore.setAutostart}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
          </div>

          <div>
            <Text strong>检查更新</Text>
            <div className="mt-2">
              <Switch
                checked={generalStore.checkUpdate}
                onChange={generalStore.setCheckUpdate}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
          </div>
        </Space>
      </Card>

      <Card title="界面设置">
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong>语言</Text>
            <div className="mt-2">
              <Select
                value={generalStore.language}
                onChange={generalStore.setLanguage}
                className="w-full"
              >
                <Option value="zh-CN">简体中文</Option>
                <Option value="en-US">English</Option>
              </Select>
            </div>
          </div>

          <div>
            <Text strong>主题</Text>
            <div className="mt-2">
              <Select
                value={generalStore.theme}
                onChange={generalStore.setTheme}
                className="w-full"
              >
                <Option value="auto">跟随系统</Option>
                <Option value="light">浅色模式</Option>
                <Option value="dark">深色模式</Option>
              </Select>
            </div>
          </div>
        </Space>
      </Card>
    </Space>
  );

  const renderModelSettings = () => (
    <Space direction="vertical" size="large" className="w-full">
      <Card
        title="模型管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            导入模型
          </Button>
        }
      >
        <div className="mb-4">
          <Text strong>当前模型: </Text>
          <Tag color="blue">{modelStore.currentModel?.name || "未选择"}</Tag>
        </div>

        <Table
          dataSource={modelStore.models}
          rowKey="id"
          size="small"
          columns={[
            {
              title: "名称",
              dataIndex: "name",
              key: "name",
            },
            {
              title: "类型",
              dataIndex: "mode",
              key: "mode",
              render: (mode) => (
                <Tag color={mode === "keyboard" ? "green" : "blue"}>
                  {mode === "keyboard"
                    ? "键盘"
                    : mode === "standard"
                    ? "标准"
                    : "手柄"}
                </Tag>
              ),
            },
            {
              title: "来源",
              dataIndex: "isPreset",
              key: "isPreset",
              render: (isPreset) => (
                <Tag color={isPreset ? "default" : "orange"}>
                  {isPreset ? "预设" : "自定义"}
                </Tag>
              ),
            },
            {
              title: "操作",
              key: "actions",
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    type={
                      modelStore.currentModel?.id === record.id
                        ? "primary"
                        : "default"
                    }
                    onClick={() => { modelStore.setCurrentModel(record); }}
                  >
                    {modelStore.currentModel?.id === record.id
                      ? "当前"
                      : "使用"}
                  </Button>
                  {!record.isPreset && (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => { modelStore.removeModel(record.id); }}
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );

  const shortcutColumns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "快捷键",
      dataIndex: "key",
      key: "key",
      render: (key: string) => <Tag>{key}</Tag>,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "状态",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled: boolean) => (
        <Tag color={enabled ? "green" : "red"}>{enabled ? "启用" : "禁用"}</Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => { handleShortcutEdit(record); }}
          />
          <Switch
            size="small"
            checked={record.enabled}
            onChange={() => { shortcutStore.toggleShortcut(record.id); }}
          />
        </Space>
      ),
    },
  ];

  const renderShortcutSettings = () => (
    <Space direction="vertical" size="large" className="w-full">
      <Card
        title="快捷键管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingShortcut(null);
              form.resetFields();
              setIsShortcutModalVisible(true);
            }}
          >
            添加快捷键
          </Button>
        }
      >
        <Table
          dataSource={shortcutStore.shortcuts}
          columns={shortcutColumns}
          rowKey="id"
          size="small"
        />
      </Card>

      <Modal
        title={editingShortcut ? "编辑快捷键" : "添加快捷键"}
        open={isShortcutModalVisible}
        onOk={handleShortcutSave}
        onCancel={() => {
          setIsShortcutModalVisible(false);
          setEditingShortcut(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入快捷键名称!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="key"
            label="快捷键"
            rules={[{ required: true, message: "请输入快捷键组合!" }]}
          >
            <Input placeholder="例如: Ctrl+Alt+H" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="enabled" valuePropName="checked" label="启用">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );

  const renderAbout = () => (
    <Space direction="vertical" size="large" className="w-full">
      <Card title="关于应用">
        <Space direction="vertical" size="middle" className="w-full">
          <div className="text-center">
            <img
              src="/logo.png"
              alt="BongoCat"
              className="w-20 h-20 mx-auto mb-4"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <Title level={3}>{appStore.name}</Title>
            <Text type="secondary">版本 {appStore.version}</Text>
          </div>

          <Divider />

          <Paragraph>
            BongoCat Next 是一个基于 Next.js 和 Tauri 构建的桌面宠物应用，
            它可以在您的桌面上显示一只可爱的猫咪，并根据您的键盘和鼠标操作做出相应的动作。
          </Paragraph>

          <Space wrap>
            <Button
              type="primary"
              icon={<GithubOutlined />}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(
                    "https://github.com/your-repo/bongo-cat-next",
                    "_blank"
                  );
                }
              }}
            >
              GitHub
            </Button>
            <Button icon={<DownloadOutlined />}>检查更新</Button>
          </Space>
        </Space>
      </Card>
    </Space>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "cat":
        return renderCatSettings();
      case "general":
        return renderGeneralSettings();
      case "model":
        return renderModelSettings();
      case "shortcut":
        return renderShortcutSettings();
      case "about":
        return renderAbout();
      default:
        return renderCatSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout className="min-h-screen">
        <Sider
          width={240}
          className="bg-white shadow-sm"
          style={{
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div className="p-4 text-center border-b">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-12 h-12 mx-auto mb-2"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <Title level={4} className="m-0">
              {appStore.name}
            </Title>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            className="border-0"
            onClick={({ key }) => { setActiveTab(key as TabKey); }}
          />

          <div className="absolute bottom-4 left-4 right-4">
            <Button
              block
              icon={<ArrowLeftOutlined />}
              onClick={() => { router.push("/"); }}
            >
              返回主界面
            </Button>
          </div>
        </Sider>

        <Layout style={{ marginLeft: 240 }}>
          <Content className="p-6">
            <div className="max-w-4xl mx-auto">{renderContent()}</div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
