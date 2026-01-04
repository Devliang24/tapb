import { useState } from 'react';
import { Modal, Tabs, Form, Input, Button, message, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import authService from '../../services/authService';
import useAuthStore from '../../stores/authStore';

const { TabPane } = Tabs;
const { Option } = Select;

const AuthModal = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const data = await authService.login(values);
      localStorage.setItem('token', data.access_token);
      const userInfo = await authService.getCurrentUser();
      setAuth(userInfo, data.access_token);
      message.success('登录成功！');
      loginForm.resetFields();
      onClose();
    } catch (error) {
      message.error(error.response?.data?.detail || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const data = await authService.register(values);
      localStorage.setItem('token', data.access_token);
      const userInfo = await authService.getCurrentUser();
      setAuth(userInfo, data.access_token);
      message.success('注册成功！');
      registerForm.resetFields();
      onClose();
    } catch (error) {
      message.error(error.response?.data?.detail || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="登录 / 注册"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="登录" key="login">
          <Form
            form={loginForm}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            initialValues={{ email: 'admin@tapb.com', password: '123456' }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="注册" key="register">
          <Form
            form={registerForm}
            name="register"
            onFinish={handleRegister}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
              initialValue="developer"
            >
              <Select placeholder="选择角色" size="large">
                <Option value="developer">开发人员</Option>
                <Option value="tester">测试人员</Option>
                <Option value="project_manager">项目经理</Option>
                <Option value="admin">管理员</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                注册
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default AuthModal;
