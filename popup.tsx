import { Card, Layout, List, Switch, Tag, Typography } from "antd"
import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

const { Content } = Layout
const { Title } = Typography

function IndexPopup() {
  const [interceptEnabled, setInterceptEnabled] = useState(false)
  const [cachedRequests, setCachedRequests] = useState({})
  const [selectedTag, setSelectedTag] = useState(null)
  const storage = new Storage()

  useEffect(() => {
    // 从存储中加载拦截状态
    // storage.get("interceptEnabled").then((value) => {
    //   setInterceptEnabled(value === true)
    // })
    // // 从存储中加载缓存的请求
    // storage.get("cachedRequests").then((value) => {
    //   setCachedRequests(value || [])
    // })
  }, [])
  useEffect(() => {
    // 保存拦截状态到存储
    storage.set("interceptEnabled", interceptEnabled)

    if (interceptEnabled) {
      // 启用网络请求监听
      chrome.webRequest.onBeforeRequest.addListener(
        handleRequest,
        // { urls: ["<all_urls>"] },
        {
          urls: [
            "https://staging.kalodata.com/api/log",
            "https://kalodata.com/api/log",
            "https://www.kalodata.com/api/log"
          ]
        },
        ["requestBody"]
      )
    } else {
      // 禁用网络请求监听
      chrome.webRequest.onBeforeRequest.removeListener(handleRequest)
    }

    return () => {
      chrome.webRequest.onBeforeRequest.removeListener(handleRequest)
    }
  }, [interceptEnabled])

  const handleRequest = (details) => {
    if (details.url.includes("/api/log")) {
      const rawData = details.requestBody.raw[0].bytes
      const data = JSON.parse(new TextDecoder().decode(rawData))
      data.forEach((item) => {
        const { kalo_event_name, kalo_pos, kalo_type, kalo_value } = item
        if (!cachedRequests[kalo_event_name]) {
          setCachedRequests((prev) => ({
            ...prev,
            [kalo_event_name]: []
          }))
        }
        setCachedRequests((prev) => ({
          ...prev,
          [kalo_event_name]: [
            ...prev[kalo_event_name],
            { kalo_pos, kalo_type, kalo_value }
          ]
        }))
      })
    }
  }

  return (
    <Layout style={{ minHeight: "100vh", width: "300px" }}>
      <Content style={{ padding: "16px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Switch
            checked={interceptEnabled}
            onChange={setInterceptEnabled}
            checkedChildren="已启用"
            unCheckedChildren="已禁用"
          />
          <span style={{ marginLeft: "8px" }}>请求拦截</span>
        </div>
        <Title level={4}>事件标签：</Title>
        <div style={{ marginBottom: "16px" }}>
          {Object.keys(cachedRequests).map((tag) => (
            <Tag
              key={tag}
              color={selectedTag === tag ? "blue" : "default"}
              onClick={() => setSelectedTag(tag)}
              style={{ cursor: "pointer", marginBottom: "8px" }}>
              {tag}
            </Tag>
          ))}
        </div>
        <Title level={4}>事件数据：</Title>
        <List
          dataSource={selectedTag ? cachedRequests[selectedTag] : []}
          renderItem={(item: any) => (
            <List.Item>
              <Card size="small" style={{ width: "100%" }}>
                <p>位置：{item.kalo_pos}</p>
                <p>类型：{item.kalo_type}</p>
                <p>值：{item.kalo_value}</p>
              </Card>
            </List.Item>
          )}
        />
      </Content>
    </Layout>
  )
}

export default IndexPopup
