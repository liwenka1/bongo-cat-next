'use client'

import { useState } from 'react'
import { Card, Slider, Switch, Button, Space, Typography, Divider, message } from 'antd'
import { UploadOutlined, DownloadOutlined, GithubOutlined } from '@ant-design/icons'
import { useCatStore } from '@/stores/catStore'
import { useRouter } from 'next/navigation'
import { openGitCommitPage } from '@/utils/scripts'

const { Title, Text } = Typography

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const {
    visible,
    opacity,
    alwaysOnTop,
    penetrable,
    mirrorMode,
    scale,
    currentModelPath,
    setVisible,
    setOpacity,
    setAlwaysOnTop,
    setPenetrable,
    setMirrorMode,
    setScale,
    setCurrentModelPath
  } = useCatStore()

  const handleAlwaysOnTopChange = async (checked: boolean) => {
    try {
      setAlwaysOnTop(checked)
      // TODO: 通知Tauri后端更新窗口属性
      console.log('Always on top:', checked)
    } catch (error) {
      console.error('Failed to update always on top:', error)
      message.error('Failed to update always on top setting')
    }
  }

  const handlePenetrableChange = async (checked: boolean) => {
    try {
      setPenetrable(checked)
      // TODO: 通知Tauri后端更新窗口属性
      console.log('Penetrable:', checked)
    } catch (error) {
      console.error('Failed to update penetrable:', error)
      message.error('Failed to update penetrable setting')
    }
  }

  const handleImportModel = async () => {
    try {
      setIsLoading(true)
      
      // 暂时使用预设模型路径
      const availableModels = ['keyboard', 'standard']
      const currentIndex = availableModels.indexOf(currentModelPath)
      const nextIndex = (currentIndex + 1) % availableModels.length
      const nextModel = availableModels[nextIndex]
      
      setCurrentModelPath(nextModel)
      message.success(`Switched to ${nextModel} model!`)
      
    } catch (error) {
      console.error('Failed to import model:', error)
      message.error('Failed to import model')
    } finally {
      setIsLoading(false)
    }
  }

  const closeWindow = async () => {
    try {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      const window = getCurrentWebviewWindow()
      await window.close()
    } catch (error) {
      console.error('Failed to close window:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Title level={2}>BongoCat Settings</Title>
          <Text type="secondary">Configure your desktop pet settings</Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Display Settings */}
          <Card title="Display Settings" className="h-fit">
            <Space direction="vertical" className="w-full" size="large">
              <div>
                <Text strong>Visibility</Text>
                <div className="mt-2">
                  <Switch 
                    checked={visible}
                    onChange={setVisible}
                    checkedChildren="Visible"
                    unCheckedChildren="Hidden"
                  />
                </div>
              </div>

              <div>
                <Text strong>Opacity: {opacity}%</Text>
                <Slider
                  min={10}
                  max={100}
                  value={opacity}
                                      onChange={(value) => setOpacity(value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Text strong>Scale: {scale.toFixed(1)}x</Text>
                <Slider
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={scale}
                  onChange={setScale}
                  className="mt-2"
                />
              </div>

              <div>
                <Text strong>Mirror Mode</Text>
                <div className="mt-2">
                  <Switch 
                    checked={mirrorMode}
                    onChange={setMirrorMode}
                    checkedChildren="Mirrored"
                    unCheckedChildren="Normal"
                  />
                </div>
              </div>
            </Space>
          </Card>

          {/* Window Settings */}
          <Card title="Window Settings" className="h-fit">
            <Space direction="vertical" className="w-full" size="large">
              <div>
                <Text strong>Always on Top</Text>
                <div className="mt-2">
                  <Switch 
                    checked={alwaysOnTop}
                    onChange={handleAlwaysOnTopChange}
                    checkedChildren="Enabled"
                    unCheckedChildren="Disabled"
                  />
                </div>
              </div>

              <div>
                <Text strong>Click Through (Penetrable)</Text>
                <div className="mt-2">
                  <Switch 
                    checked={penetrable}
                    onChange={handlePenetrableChange}
                    checkedChildren="Enabled"
                    unCheckedChildren="Disabled"
                  />
                </div>
                <Text type="secondary" className="text-xs">
                  When enabled, mouse clicks will pass through the cat
                </Text>
              </div>
            </Space>
          </Card>

          {/* Model Settings */}
          <Card title="Model Settings" className="h-fit">
            <Space direction="vertical" className="w-full" size="large">
              <div>
                <Text strong>Current Model</Text>
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  {currentModelPath || 'keyboard'}
                </div>
              </div>

              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                onClick={handleImportModel}
                loading={isLoading}
                block
              >
                Switch Model (keyboard ↔ standard)
              </Button>

              <Button 
                icon={<DownloadOutlined />}
                onClick={() => message.info('Model export feature coming soon!')}
                block
              >
                Export Current Model
              </Button>
            </Space>
          </Card>

          {/* Information */}
          <Card title="Information" className="h-fit">
            <Space direction="vertical" className="w-full" size="large">
              <div>
                <Text strong>About BongoCat Next</Text>
                <div className="mt-2">
                  <Text type="secondary">
                    A desktop pet application built with Next.js and Tauri.
                    Inspired by the original BongoCat project.
                  </Text>
                </div>
              </div>

              <div>
                <Text strong>Version</Text>
                <div className="mt-2">
                  <Text>0.1.0</Text>
                </div>
              </div>

              <div>
                <Text strong>Key Features</Text>
                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                  <li>Live2D model support</li>
                  <li>Keyboard and mouse interaction</li>
                  <li>Customizable appearance</li>
                  <li>Always on top mode</li>
                  <li>Click-through mode</li>
                </ul>
              </div>
            </Space>
          </Card>

          {/* Git Settings */}
          <Card title="Git 工具" className="h-fit">
            <Space direction="vertical" className="w-full" size="large">
              <div>
                <Text strong>Git 提交工具</Text>
                <div className="mt-2">
                  <Text type="secondary" className="text-sm">
                    使用约定格式（feat:xxx, fix:xxx）进行代码提交
                  </Text>
                </div>
              </div>

              <Button 
                type="primary" 
                icon={<GithubOutlined />}
                onClick={() => { 
                  openGitCommitPage().catch((err: unknown) => { 
                    message.error('打开Git提交工具失败') 
                    console.error('Failed to open Git commit page:', err)
                  })
                }}
                block
              >
                前往 Git 提交工具
              </Button>
            </Space>
          </Card>
        </div>

        <Divider />

        <div className="text-center">
          <Button onClick={closeWindow} size="large">
            Close Settings
          </Button>
        </div>
      </div>
    </div>
  )
} 