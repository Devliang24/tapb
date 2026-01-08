"""
Seed 100 realistic test cases for the DEMO project.
- Creates test case categories (directories)
- Deletes existing test cases and categories first
- Creates 100 test cases across different modules

Run: python3 seed_testcases.py
"""
import random
from datetime import datetime

from app.database import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.testcase import (
    TestCase, TestCaseCategory, TestCaseHistory,
    TestCaseType, TestCaseStatus, TestCasePriority
)

PROJECT_KEY = 'DEMO'

# 测试用例目录结构
CATEGORIES = {
    '用户认证': ['登录功能', '注册功能', '找回密码', '第三方登录'],
    '用户中心': ['个人资料', '账户安全', '消息通知'],
    '空间管理': ['空间创建', '成员管理', '权限设置'],
    '需求管理': ['需求列表', '需求详情', '需求筛选', '批量操作'],
    '缺陷管理': ['缺陷列表', '缺陷详情', '缺陷流转'],
    '迭代管理': ['迭代列表', '迭代看板', '燃尽图'],
    '测试用例': ['用例列表', '用例导入导出', '用例执行'],
    '文件上传': ['图片上传', '附件管理'],
    '搜索功能': ['全局搜索', '高级筛选'],
    '系统设置': ['基础配置', '集成设置'],
}

# 100条真实测试用例数据
TEST_CASES = [
    # 登录功能 (10条)
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '使用正确的用户名和密码登录',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '1. 用户已完成注册\n2. 用户处于登出状态\n3. 登录页面正常加载',
        'steps': '1. 打开登录页面\n2. 输入正确的用户名\n3. 输入正确的密码\n4. 点击登录按钮',
        'expected_result': '1. 登录成功\n2. 页面跳转到首页\n3. 显示用户头像和昵称',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '使用错误密码登录',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '1. 用户已完成注册\n2. 登录页面正常加载',
        'steps': '1. 打开登录页面\n2. 输入正确的用户名\n3. 输入错误的密码\n4. 点击登录按钮',
        'expected_result': '1. 登录失败\n2. 显示错误提示"用户名或密码错误"\n3. 密码输入框清空',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '用户名为空时登录',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '登录页面正常加载',
        'steps': '1. 打开登录页面\n2. 不输入用户名\n3. 输入密码\n4. 点击登录按钮',
        'expected_result': '1. 登录按钮不可点击或点击无效\n2. 显示"请输入用户名"提示',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '密码为空时登录',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '登录页面正常加载',
        'steps': '1. 打开登录页面\n2. 输入用户名\n3. 不输入密码\n4. 点击登录按钮',
        'expected_result': '1. 登录按钮不可点击或点击无效\n2. 显示"请输入密码"提示',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '连续登录失败后账户锁定',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.SECURITY,
        'priority': TestCasePriority.HIGH,
        'precondition': '1. 用户已注册\n2. 账户状态正常',
        'steps': '1. 打开登录页面\n2. 输入正确用户名\n3. 连续5次输入错误密码并点击登录',
        'expected_result': '1. 第5次失败后显示账户已锁定提示\n2. 提示15分钟后可重试\n3. 即使输入正确密码也无法登录',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '记住登录状态功能',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '1. 用户已注册\n2. 浏览器Cookie正常',
        'steps': '1. 打开登录页面\n2. 输入正确的用户名和密码\n3. 勾选"记住我"\n4. 点击登录\n5. 关闭浏览器后重新打开',
        'expected_result': '1. 登录成功\n2. 重新打开浏览器后自动登录\n3. 7天内无需再次输入密码',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '登录页面响应式布局',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.COMPATIBILITY,
        'priority': TestCasePriority.LOW,
        'precondition': '准备不同尺寸的设备或浏览器窗口',
        'steps': '1. 在桌面浏览器(1920x1080)打开登录页\n2. 在平板尺寸(768x1024)查看\n3. 在手机尺寸(375x667)查看',
        'expected_result': '1. 各尺寸下页面布局正常\n2. 输入框和按钮可正常使用\n3. 无横向滚动条',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': 'SQL注入攻击测试',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.SECURITY,
        'priority': TestCasePriority.HIGH,
        'precondition': '登录页面正常加载',
        'steps': '1. 在用户名输入框输入: \' OR 1=1 --\n2. 密码随意输入\n3. 点击登录',
        'expected_result': '1. 登录失败\n2. 系统不返回数据库错误信息\n3. 无异常行为',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': 'XSS攻击测试',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.SECURITY,
        'priority': TestCasePriority.HIGH,
        'precondition': '登录页面正常加载',
        'steps': '1. 在用户名输入框输入: <script>alert(1)</script>\n2. 点击登录',
        'expected_result': '1. 脚本不被执行\n2. 输入被正确转义显示\n3. 无弹窗出现',
    },
    {
        'category_path': ('用户认证', '登录功能'),
        'name': '登录接口性能测试',
        'module': '用户认证',
        'feature': '登录',
        'type': TestCaseType.PERFORMANCE,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '准备性能测试工具(如JMeter)',
        'steps': '1. 配置100并发用户\n2. 持续请求登录接口60秒\n3. 记录响应时间和错误率',
        'expected_result': '1. 平均响应时间<500ms\n2. P99响应时间<2s\n3. 错误率<1%',
    },
    
    # 注册功能 (8条)
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '使用有效信息注册新用户',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '1. 注册页面正常加载\n2. 准备未注册的手机号',
        'steps': '1. 打开注册页面\n2. 输入有效手机号\n3. 获取并输入验证码\n4. 设置符合要求的密码\n5. 点击注册',
        'expected_result': '1. 注册成功\n2. 自动跳转到首页\n3. 显示新用户引导',
    },
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '使用已注册手机号注册',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '准备已注册的手机号',
        'steps': '1. 打开注册页面\n2. 输入已注册的手机号\n3. 点击获取验证码',
        'expected_result': '1. 显示"该手机号已注册"提示\n2. 提供"去登录"链接',
    },
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '手机号格式校验',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '注册页面正常加载',
        'steps': '1. 输入非11位数字(如12345)\n2. 输入包含字母的内容\n3. 输入非1开头的11位数字',
        'expected_result': '1. 显示"请输入正确的手机号"提示\n2. 获取验证码按钮不可用',
    },
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '验证码60秒倒计时',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '注册页面正常加载',
        'steps': '1. 输入有效手机号\n2. 点击获取验证码\n3. 观察按钮状态变化',
        'expected_result': '1. 按钮变为倒计时状态\n2. 显示剩余秒数\n3. 60秒后恢复可点击',
    },
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '密码强度校验',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '注册页面正常加载',
        'steps': '1. 输入纯数字密码\n2. 输入少于8位密码\n3. 输入包含字母数字的8位以上密码',
        'expected_result': '1. 弱密码显示红色提示\n2. 中等强度显示黄色\n3. 强密码显示绿色',
    },
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '两次密码一致性校验',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '注册页面正常加载',
        'steps': '1. 在密码框输入: Password123\n2. 在确认密码框输入: Password124\n3. 点击下一步或提交',
        'expected_result': '1. 显示"两次密码输入不一致"提示\n2. 无法提交表单',
    },
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '用户协议勾选验证',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '注册页面正常加载',
        'steps': '1. 填写所有必填信息\n2. 不勾选用户协议\n3. 点击注册按钮',
        'expected_result': '1. 注册按钮不可用或点击无效\n2. 提示"请阅读并同意用户协议"',
    },
    {
        'category_path': ('用户认证', '注册功能'),
        'name': '注册短信发送频率限制',
        'module': '用户认证',
        'feature': '注册',
        'type': TestCaseType.SECURITY,
        'priority': TestCasePriority.HIGH,
        'precondition': '注册页面正常加载',
        'steps': '1. 输入有效手机号\n2. 连续点击10次获取验证码(通过工具绕过前端限制)',
        'expected_result': '1. 后端限制每分钟最多1次\n2. 每小时最多5次\n3. 超限返回429错误',
    },
    
    # 找回密码 (5条)
    {
        'category_path': ('用户认证', '找回密码'),
        'name': '通过手机号找回密码',
        'module': '用户认证',
        'feature': '找回密码',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户已注册并记得手机号',
        'steps': '1. 点击"忘记密码"\n2. 输入注册手机号\n3. 获取并输入验证码\n4. 设置新密码\n5. 确认提交',
        'expected_result': '1. 密码重置成功\n2. 提示使用新密码登录\n3. 旧密码失效',
    },
    {
        'category_path': ('用户认证', '找回密码'),
        'name': '通过邮箱找回密码',
        'module': '用户认证',
        'feature': '找回密码',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户已绑定邮箱',
        'steps': '1. 点击"忘记密码"\n2. 选择邮箱方式\n3. 输入绑定邮箱\n4. 点击发送重置链接\n5. 查收邮件并点击链接\n6. 设置新密码',
        'expected_result': '1. 邮件15分钟内送达\n2. 链接24小时内有效\n3. 密码重置成功',
    },
    {
        'category_path': ('用户认证', '找回密码'),
        'name': '重置链接过期测试',
        'module': '用户认证',
        'feature': '找回密码',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '获取一个超过24小时的重置链接',
        'steps': '1. 点击过期的重置链接\n2. 尝试设置新密码',
        'expected_result': '1. 显示"链接已过期"提示\n2. 提供重新获取链接的入口',
    },
    {
        'category_path': ('用户认证', '找回密码'),
        'name': '重置链接单次有效性',
        'module': '用户认证',
        'feature': '找回密码',
        'type': TestCaseType.SECURITY,
        'priority': TestCasePriority.HIGH,
        'precondition': '获取有效的重置链接',
        'steps': '1. 使用重置链接修改密码\n2. 再次点击同一链接',
        'expected_result': '1. 第一次修改成功\n2. 第二次显示"链接已使用"\n3. 链接失效',
    },
    {
        'category_path': ('用户认证', '找回密码'),
        'name': '未注册手机号找回密码',
        'module': '用户认证',
        'feature': '找回密码',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '准备未注册的手机号',
        'steps': '1. 点击"忘记密码"\n2. 输入未注册的手机号\n3. 点击下一步',
        'expected_result': '1. 显示"该手机号未注册"\n2. 提供注册入口链接',
    },
    
    # 第三方登录 (5条)
    {
        'category_path': ('用户认证', '第三方登录'),
        'name': '微信扫码登录',
        'module': '用户认证',
        'feature': '第三方登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '1. 已配置微信开放平台\n2. 微信App已安装',
        'steps': '1. 点击微信登录图标\n2. 显示二维码\n3. 使用微信扫码\n4. 在微信中确认授权',
        'expected_result': '1. 二维码正常显示\n2. 授权后自动登录\n3. 获取微信头像和昵称',
    },
    {
        'category_path': ('用户认证', '第三方登录'),
        'name': '微信登录绑定已有账号',
        'module': '用户认证',
        'feature': '第三方登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '1. 用户已有账号\n2. 微信未绑定该账号',
        'steps': '1. 使用微信扫码\n2. 选择"绑定已有账号"\n3. 输入已有账号密码\n4. 确认绑定',
        'expected_result': '1. 绑定成功\n2. 后续可直接微信登录\n3. 账户信息合并',
    },
    {
        'category_path': ('用户认证', '第三方登录'),
        'name': '微信登录二维码超时',
        'module': '用户认证',
        'feature': '第三方登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '显示微信登录二维码',
        'steps': '1. 显示二维码后等待5分钟\n2. 不进行扫码操作',
        'expected_result': '1. 二维码显示已过期\n2. 提供刷新按钮\n3. 点击刷新生成新二维码',
    },
    {
        'category_path': ('用户认证', '第三方登录'),
        'name': 'GitHub OAuth登录',
        'module': '用户认证',
        'feature': '第三方登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '已配置GitHub OAuth应用',
        'steps': '1. 点击GitHub登录图标\n2. 跳转到GitHub授权页\n3. 点击Authorize\n4. 自动跳回应用',
        'expected_result': '1. 正确跳转到GitHub\n2. 授权后回调成功\n3. 获取GitHub用户信息',
    },
    {
        'category_path': ('用户认证', '第三方登录'),
        'name': '取消第三方授权',
        'module': '用户认证',
        'feature': '第三方登录',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '进入第三方授权页面',
        'steps': '1. 点击微信/GitHub登录\n2. 在授权页点击取消/拒绝',
        'expected_result': '1. 正确返回登录页\n2. 显示"授权已取消"提示\n3. 无异常错误',
    },
    
    # 个人资料 (6条)
    {
        'category_path': ('用户中心', '个人资料'),
        'name': '修改用户昵称',
        'module': '用户中心',
        'feature': '个人资料',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '用户已登录',
        'steps': '1. 进入个人资料页\n2. 点击昵称编辑按钮\n3. 输入新昵称\n4. 点击保存',
        'expected_result': '1. 保存成功提示\n2. 页面显示新昵称\n3. 其他页面同步更新',
    },
    {
        'category_path': ('用户中心', '个人资料'),
        'name': '上传用户头像',
        'module': '用户中心',
        'feature': '个人资料',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '1. 用户已登录\n2. 准备合规图片文件',
        'steps': '1. 进入个人资料页\n2. 点击头像\n3. 选择本地图片\n4. 裁剪并确认',
        'expected_result': '1. 图片上传成功\n2. 头像实时更新\n3. 导航栏头像同步',
    },
    {
        'category_path': ('用户中心', '个人资料'),
        'name': '头像文件大小限制',
        'module': '用户中心',
        'feature': '个人资料',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '准备超过5MB的图片',
        'steps': '1. 点击更换头像\n2. 选择超大图片文件',
        'expected_result': '1. 显示"文件大小不能超过5MB"\n2. 不发起上传请求',
    },
    {
        'category_path': ('用户中心', '个人资料'),
        'name': '头像文件格式校验',
        'module': '用户中心',
        'feature': '个人资料',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '准备非图片文件(.exe, .txt等)',
        'steps': '1. 点击更换头像\n2. 选择非图片文件',
        'expected_result': '1. 显示"仅支持JPG/PNG/GIF格式"\n2. 文件被拒绝',
    },
    {
        'category_path': ('用户中心', '个人资料'),
        'name': '昵称特殊字符校验',
        'module': '用户中心',
        'feature': '个人资料',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '用户已登录',
        'steps': '1. 尝试将昵称设为: <script>alert(1)</script>\n2. 尝试设为纯空格\n3. 尝试设为超过20字符',
        'expected_result': '1. 特殊字符被过滤或转义\n2. 纯空格不允许\n3. 超长被截断或提示',
    },
    {
        'category_path': ('用户中心', '个人资料'),
        'name': '个人简介编辑',
        'module': '用户中心',
        'feature': '个人资料',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '用户已登录',
        'steps': '1. 进入个人资料页\n2. 编辑个人简介\n3. 输入200字以内内容\n4. 保存',
        'expected_result': '1. 保存成功\n2. 支持换行显示\n3. 超过200字提示限制',
    },
    
    # 账户安全 (5条)
    {
        'category_path': ('用户中心', '账户安全'),
        'name': '修改登录密码',
        'module': '用户中心',
        'feature': '账户安全',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户已登录',
        'steps': '1. 进入安全设置\n2. 点击修改密码\n3. 输入原密码\n4. 输入新密码并确认\n5. 提交',
        'expected_result': '1. 密码修改成功\n2. 要求重新登录\n3. 新密码立即生效',
    },
    {
        'category_path': ('用户中心', '账户安全'),
        'name': '绑定手机号',
        'module': '用户中心',
        'feature': '账户安全',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '账号未绑定手机号',
        'steps': '1. 进入安全设置\n2. 点击绑定手机\n3. 输入手机号\n4. 获取验证码\n5. 确认绑定',
        'expected_result': '1. 绑定成功\n2. 安全等级提升\n3. 可用于登录和找回密码',
    },
    {
        'category_path': ('用户中心', '账户安全'),
        'name': '更换绑定手机号',
        'module': '用户中心',
        'feature': '账户安全',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '账号已绑定手机号',
        'steps': '1. 进入安全设置\n2. 点击更换手机\n3. 验证原手机号\n4. 输入新手机号并验证\n5. 确认更换',
        'expected_result': '1. 需先验证原手机\n2. 更换成功\n3. 旧手机号解绑',
    },
    {
        'category_path': ('用户中心', '账户安全'),
        'name': '开启两步验证',
        'module': '用户中心',
        'feature': '账户安全',
        'type': TestCaseType.SECURITY,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '用户已登录，已绑定手机',
        'steps': '1. 进入安全设置\n2. 开启两步验证\n3. 扫描二维码添加到验证器\n4. 输入动态码确认',
        'expected_result': '1. 显示TOTP二维码\n2. 验证成功后开启\n3. 下次登录需输入动态码',
    },
    {
        'category_path': ('用户中心', '账户安全'),
        'name': '查看登录设备列表',
        'module': '用户中心',
        'feature': '账户安全',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '用户在多设备登录过',
        'steps': '1. 进入安全设置\n2. 查看登录设备\n3. 选择某设备下线',
        'expected_result': '1. 显示设备列表\n2. 包含IP和登录时间\n3. 可强制下线其他设备',
    },
    
    # 消息通知 (4条)
    {
        'category_path': ('用户中心', '消息通知'),
        'name': '查看站内消息列表',
        'module': '用户中心',
        'feature': '消息通知',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '用户有未读消息',
        'steps': '1. 点击顶部消息图标\n2. 查看消息列表\n3. 点击某条消息',
        'expected_result': '1. 显示未读数量角标\n2. 列表按时间倒序\n3. 点击后标记已读',
    },
    {
        'category_path': ('用户中心', '消息通知'),
        'name': '一键已读所有消息',
        'module': '用户中心',
        'feature': '消息通知',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '有多条未读消息',
        'steps': '1. 打开消息列表\n2. 点击"全部已读"按钮',
        'expected_result': '1. 所有消息标记已读\n2. 角标清零\n3. 列表状态更新',
    },
    {
        'category_path': ('用户中心', '消息通知'),
        'name': '通知偏好设置',
        'module': '用户中心',
        'feature': '消息通知',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '用户已登录',
        'steps': '1. 进入通知设置\n2. 关闭某类通知\n3. 触发该类事件',
        'expected_result': '1. 设置保存成功\n2. 关闭的通知不再发送\n3. 其他通知正常',
    },
    {
        'category_path': ('用户中心', '消息通知'),
        'name': '@提及实时通知',
        'module': '用户中心',
        'feature': '消息通知',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '两个测试账号',
        'steps': '1. A用户在评论中@B用户\n2. 观察B用户收到通知',
        'expected_result': '1. B立即收到站内通知\n2. 通知显示@内容\n3. 点击跳转到相关页面',
    },
    
    # 空间创建 (5条)
    {
        'category_path': ('空间管理', '空间创建'),
        'name': '创建新空间',
        'module': '空间管理',
        'feature': '空间创建',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户已登录',
        'steps': '1. 点击创建空间\n2. 输入空间名称\n3. 选择空间类型\n4. 填写空间描述\n5. 点击创建',
        'expected_result': '1. 空间创建成功\n2. 自动进入新空间\n3. 当前用户为管理员',
    },
    {
        'category_path': ('空间管理', '空间创建'),
        'name': '空间名称重复校验',
        'module': '空间管理',
        'feature': '空间创建',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '已存在名为"测试空间"的空间',
        'steps': '1. 创建新空间\n2. 输入"测试空间"作为名称\n3. 提交',
        'expected_result': '1. 显示"空间名称已存在"\n2. 创建失败',
    },
    {
        'category_path': ('空间管理', '空间创建'),
        'name': '空间名称长度限制',
        'module': '空间管理',
        'feature': '空间创建',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '用户已登录',
        'steps': '1. 尝试输入超过50字符的空间名\n2. 尝试输入空名称',
        'expected_result': '1. 超长名称被截断或提示\n2. 空名称不允许提交',
    },
    {
        'category_path': ('空间管理', '空间创建'),
        'name': '空间Key唯一性',
        'module': '空间管理',
        'feature': '空间创建',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '已存在Key为"DEMO"的空间',
        'steps': '1. 创建新空间\n2. 输入"DEMO"作为Key\n3. 提交',
        'expected_result': '1. 显示"Key已被使用"\n2. 创建失败\n3. 建议可用的Key',
    },
    {
        'category_path': ('空间管理', '空间创建'),
        'name': '删除空间',
        'module': '空间管理',
        'feature': '空间创建',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户为空间管理员',
        'steps': '1. 进入空间设置\n2. 点击删除空间\n3. 输入空间名称确认\n4. 确认删除',
        'expected_result': '1. 需要二次确认\n2. 删除成功\n3. 所有数据被清除\n4. 成员被移除',
    },
    
    # 成员管理 (5条)
    {
        'category_path': ('空间管理', '成员管理'),
        'name': '邀请新成员',
        'module': '空间管理',
        'feature': '成员管理',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户为空间管理员',
        'steps': '1. 进入成员管理\n2. 点击邀请成员\n3. 输入成员邮箱/用户名\n4. 选择角色\n5. 发送邀请',
        'expected_result': '1. 邀请发送成功\n2. 被邀请人收到通知\n3. 显示待确认状态',
    },
    {
        'category_path': ('空间管理', '成员管理'),
        'name': '接受邀请加入空间',
        'module': '空间管理',
        'feature': '成员管理',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '收到空间邀请通知',
        'steps': '1. 点击邀请通知\n2. 查看空间信息\n3. 点击接受邀请',
        'expected_result': '1. 成功加入空间\n2. 具有对应角色权限\n3. 空间列表显示新空间',
    },
    {
        'category_path': ('空间管理', '成员管理'),
        'name': '移除空间成员',
        'module': '空间管理',
        'feature': '成员管理',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户为空间管理员',
        'steps': '1. 进入成员列表\n2. 选择某成员\n3. 点击移除\n4. 确认移除',
        'expected_result': '1. 成员被移除\n2. 该用户无法访问空间\n3. 其创建的内容保留',
    },
    {
        'category_path': ('空间管理', '成员管理'),
        'name': '修改成员角色',
        'module': '空间管理',
        'feature': '成员管理',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '用户为空间管理员',
        'steps': '1. 进入成员列表\n2. 选择某成员\n3. 修改其角色\n4. 保存',
        'expected_result': '1. 角色修改成功\n2. 权限立即生效\n3. 成员收到通知',
    },
    {
        'category_path': ('空间管理', '成员管理'),
        'name': '不能移除唯一管理员',
        'module': '空间管理',
        'feature': '成员管理',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '空间只有一个管理员',
        'steps': '1. 尝试移除唯一管理员\n2. 或尝试将其降级为普通成员',
        'expected_result': '1. 操作被阻止\n2. 提示"需至少保留一名管理员"',
    },
    
    # 权限设置 (4条)
    {
        'category_path': ('空间管理', '权限设置'),
        'name': '普通成员权限验证',
        'module': '空间管理',
        'feature': '权限设置',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '以普通成员身份登录',
        'steps': '1. 尝试访问空间设置\n2. 尝试删除他人创建的内容\n3. 尝试邀请新成员',
        'expected_result': '1. 空间设置不可见\n2. 删除按钮不可用\n3. 邀请按钮不可见',
    },
    {
        'category_path': ('空间管理', '权限设置'),
        'name': '只读成员权限验证',
        'module': '空间管理',
        'feature': '权限设置',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '以只读成员身份登录',
        'steps': '1. 尝试创建需求\n2. 尝试编辑缺陷\n3. 尝试添加评论',
        'expected_result': '1. 创建按钮不可用\n2. 编辑按钮不可用\n3. 评论输入框不可用',
    },
    {
        'category_path': ('空间管理', '权限设置'),
        'name': '管理员权限验证',
        'module': '空间管理',
        'feature': '权限设置',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '以管理员身份登录',
        'steps': '1. 访问空间设置\n2. 邀请新成员\n3. 删除内容\n4. 修改成员角色',
        'expected_result': '1. 所有操作均可执行\n2. 显示管理功能入口',
    },
    {
        'category_path': ('空间管理', '权限设置'),
        'name': '权限变更实时生效',
        'module': '空间管理',
        'feature': '权限设置',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '两个账号在线',
        'steps': '1. A管理员将B从成员改为只读\n2. B不刷新页面尝试操作',
        'expected_result': '1. B的操作被拒绝\n2. 显示权限不足提示\n3. 无需重新登录',
    },
    
    # 需求列表 (6条)
    {
        'category_path': ('需求管理', '需求列表'),
        'name': '查看需求列表',
        'module': '需求管理',
        'feature': '需求列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '空间中存在需求数据',
        'steps': '1. 进入空间\n2. 点击需求Tab\n3. 查看需求列表',
        'expected_result': '1. 列表正常加载\n2. 显示需求编号和标题\n3. 显示状态和优先级',
    },
    {
        'category_path': ('需求管理', '需求列表'),
        'name': '创建新需求',
        'module': '需求管理',
        'feature': '需求列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户有创建权限',
        'steps': '1. 点击新建需求\n2. 填写标题和描述\n3. 选择优先级\n4. 提交',
        'expected_result': '1. 需求创建成功\n2. 自动分配编号\n3. 列表显示新需求',
    },
    {
        'category_path': ('需求管理', '需求列表'),
        'name': '需求分页加载',
        'module': '需求管理',
        'feature': '需求列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '需求数量超过20条',
        'steps': '1. 打开需求列表\n2. 滚动到底部\n3. 或点击下一页',
        'expected_result': '1. 每页显示20条\n2. 翻页正常\n3. 显示总数和当前页',
    },
    {
        'category_path': ('需求管理', '需求列表'),
        'name': '批量删除需求',
        'module': '需求管理',
        'feature': '需求列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '用户有删除权限',
        'steps': '1. 勾选多条需求\n2. 点击批量删除\n3. 确认删除',
        'expected_result': '1. 删除成功\n2. 列表刷新\n3. 关联的任务不删除',
    },
    {
        'category_path': ('需求管理', '需求列表'),
        'name': '需求列表排序',
        'module': '需求管理',
        'feature': '需求列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '存在多条需求',
        'steps': '1. 点击创建时间列头\n2. 点击优先级列头\n3. 点击状态列头',
        'expected_result': '1. 按点击列排序\n2. 再次点击反向排序\n3. 显示排序箭头',
    },
    {
        'category_path': ('需求管理', '需求列表'),
        'name': '需求列表为空状态',
        'module': '需求管理',
        'feature': '需求列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '空间内无需求',
        'steps': '1. 进入空的空间\n2. 查看需求列表',
        'expected_result': '1. 显示空状态插图\n2. 显示"暂无需求"文案\n3. 显示创建按钮',
    },
    
    # 需求详情 (5条)
    {
        'category_path': ('需求管理', '需求详情'),
        'name': '查看需求详情',
        'module': '需求管理',
        'feature': '需求详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '存在需求数据',
        'steps': '1. 在需求列表点击某条需求\n2. 查看详情抽屉',
        'expected_result': '1. 详情正常显示\n2. 包含完整描述\n3. 显示关联信息',
    },
    {
        'category_path': ('需求管理', '需求详情'),
        'name': '编辑需求信息',
        'module': '需求管理',
        'feature': '需求详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户有编辑权限',
        'steps': '1. 打开需求详情\n2. 点击编辑按钮\n3. 修改标题和描述\n4. 保存',
        'expected_result': '1. 进入编辑模式\n2. 保存成功\n3. 记录修改历史',
    },
    {
        'category_path': ('需求管理', '需求详情'),
        'name': '修改需求状态',
        'module': '需求管理',
        'feature': '需求详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '需求处于待处理状态',
        'steps': '1. 打开需求详情\n2. 点击状态下拉\n3. 选择"进行中"\n4. 观察变化',
        'expected_result': '1. 状态更新成功\n2. 记录状态变更\n3. 列表同步更新',
    },
    {
        'category_path': ('需求管理', '需求详情'),
        'name': '添加需求评论',
        'module': '需求管理',
        'feature': '需求详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '用户有评论权限',
        'steps': '1. 打开需求详情\n2. 切换到评论Tab\n3. 输入评论内容\n4. 点击发送',
        'expected_result': '1. 评论发送成功\n2. 显示评论者和时间\n3. 被@的人收到通知',
    },
    {
        'category_path': ('需求管理', '需求详情'),
        'name': '查看需求操作历史',
        'module': '需求管理',
        'feature': '需求详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '需求有变更记录',
        'steps': '1. 打开需求详情\n2. 切换到历史Tab',
        'expected_result': '1. 显示完整变更记录\n2. 包含操作人和时间\n3. 显示变更前后内容',
    },
    
    # 需求筛选 (4条)
    {
        'category_path': ('需求管理', '需求筛选'),
        'name': '按状态筛选需求',
        'module': '需求管理',
        'feature': '需求筛选',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '存在不同状态的需求',
        'steps': '1. 点击状态筛选器\n2. 选择"进行中"\n3. 查看筛选结果',
        'expected_result': '1. 只显示进行中的需求\n2. 筛选条件高亮\n3. 显示筛选后数量',
    },
    {
        'category_path': ('需求管理', '需求筛选'),
        'name': '按优先级筛选需求',
        'module': '需求管理',
        'feature': '需求筛选',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '存在不同优先级的需求',
        'steps': '1. 点击优先级筛选器\n2. 选择"高"\n3. 查看结果',
        'expected_result': '1. 只显示高优先级需求\n2. 可组合状态筛选',
    },
    {
        'category_path': ('需求管理', '需求筛选'),
        'name': '按关键词搜索需求',
        'module': '需求管理',
        'feature': '需求筛选',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '存在多条需求',
        'steps': '1. 在搜索框输入关键词\n2. 回车或点击搜索',
        'expected_result': '1. 搜索标题和描述\n2. 高亮匹配关键词\n3. 无结果显示空状态',
    },
    {
        'category_path': ('需求管理', '需求筛选'),
        'name': '清除筛选条件',
        'module': '需求管理',
        'feature': '需求筛选',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '已应用筛选条件',
        'steps': '1. 点击清除筛选按钮\n2. 或逐个移除筛选标签',
        'expected_result': '1. 筛选条件被清除\n2. 显示全部需求\n3. 筛选器重置',
    },
    
    # 缺陷列表 (5条)
    {
        'category_path': ('缺陷管理', '缺陷列表'),
        'name': '查看缺陷列表',
        'module': '缺陷管理',
        'feature': '缺陷列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '空间存在缺陷',
        'steps': '1. 进入空间\n2. 点击缺陷Tab\n3. 查看列表',
        'expected_result': '1. 列表正常加载\n2. 显示严重程度标签\n3. 显示处理人',
    },
    {
        'category_path': ('缺陷管理', '缺陷列表'),
        'name': '创建新缺陷',
        'module': '缺陷管理',
        'feature': '缺陷列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户有创建权限',
        'steps': '1. 点击新建缺陷\n2. 填写标题和描述\n3. 上传截图\n4. 选择严重程度\n5. 提交',
        'expected_result': '1. 缺陷创建成功\n2. 自动分配编号\n3. 通知相关人员',
    },
    {
        'category_path': ('缺陷管理', '缺陷列表'),
        'name': '按严重程度筛选缺陷',
        'module': '缺陷管理',
        'feature': '缺陷列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '存在不同严重程度的缺陷',
        'steps': '1. 点击严重程度筛选\n2. 选择"阻塞"\n3. 查看结果',
        'expected_result': '1. 只显示阻塞级别缺陷\n2. 列表数量更新',
    },
    {
        'category_path': ('缺陷管理', '缺陷列表'),
        'name': '导出缺陷列表',
        'module': '缺陷管理',
        'feature': '缺陷列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '存在缺陷数据',
        'steps': '1. 点击导出按钮\n2. 选择导出格式(Excel)\n3. 下载文件',
        'expected_result': '1. 导出成功\n2. 文件包含所有字段\n3. 中文无乱码',
    },
    {
        'category_path': ('缺陷管理', '缺陷列表'),
        'name': '我创建的缺陷筛选',
        'module': '缺陷管理',
        'feature': '缺陷列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '当前用户创建过缺陷',
        'steps': '1. 点击筛选器\n2. 选择"我创建的"',
        'expected_result': '1. 只显示当前用户创建的缺陷\n2. 快捷筛选高亮',
    },
    
    # 缺陷详情 (4条)
    {
        'category_path': ('缺陷管理', '缺陷详情'),
        'name': '查看缺陷详情',
        'module': '缺陷管理',
        'feature': '缺陷详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '存在缺陷',
        'steps': '1. 点击缺陷标题\n2. 查看详情抽屉',
        'expected_result': '1. 显示完整描述\n2. 显示复现步骤\n3. 显示附件图片',
    },
    {
        'category_path': ('缺陷管理', '缺陷详情'),
        'name': '指派缺陷处理人',
        'module': '缺陷管理',
        'feature': '缺陷详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '缺陷未指派',
        'steps': '1. 打开缺陷详情\n2. 点击处理人下拉\n3. 选择成员\n4. 保存',
        'expected_result': '1. 指派成功\n2. 被指派人收到通知\n3. 状态可自动变更',
    },
    {
        'category_path': ('缺陷管理', '缺陷详情'),
        'name': '关联缺陷到需求',
        'module': '缺陷管理',
        'feature': '缺陷详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '存在需求数据',
        'steps': '1. 打开缺陷详情\n2. 点击关联需求\n3. 搜索并选择需求\n4. 确认关联',
        'expected_result': '1. 关联成功\n2. 需求详情显示关联缺陷\n3. 可取消关联',
    },
    {
        'category_path': ('缺陷管理', '缺陷详情'),
        'name': '缺陷附件上传',
        'module': '缺陷管理',
        'feature': '缺陷详情',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '准备测试文件',
        'steps': '1. 打开缺陷编辑\n2. 点击上传附件\n3. 选择文件\n4. 保存',
        'expected_result': '1. 上传成功\n2. 显示文件预览\n3. 可下载附件',
    },
    
    # 缺陷流转 (4条)
    {
        'category_path': ('缺陷管理', '缺陷流转'),
        'name': '缺陷状态从新建到处理中',
        'module': '缺陷管理',
        'feature': '缺陷流转',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '缺陷处于新建状态',
        'steps': '1. 打开缺陷详情\n2. 点击"开始处理"按钮',
        'expected_result': '1. 状态变为处理中\n2. 自动指派给当前用户\n3. 记录状态变更',
    },
    {
        'category_path': ('缺陷管理', '缺陷流转'),
        'name': '缺陷解决流程',
        'module': '缺陷管理',
        'feature': '缺陷流转',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '缺陷处于处理中状态',
        'steps': '1. 点击"已解决"\n2. 填写解决方案\n3. 提交',
        'expected_result': '1. 状态变为已解决\n2. 通知创建者验证\n3. 记录解决方案',
    },
    {
        'category_path': ('缺陷管理', '缺陷流转'),
        'name': '缺陷验证通过关闭',
        'module': '缺陷管理',
        'feature': '缺陷流转',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '缺陷处于已解决状态',
        'steps': '1. 创建者打开缺陷\n2. 点击"验证通过"\n3. 确认关闭',
        'expected_result': '1. 状态变为已关闭\n2. 缺陷完结\n3. 可查看完整流转记录',
    },
    {
        'category_path': ('缺陷管理', '缺陷流转'),
        'name': '缺陷验证不通过重新打开',
        'module': '缺陷管理',
        'feature': '缺陷流转',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '缺陷处于已解决状态',
        'steps': '1. 创建者打开缺陷\n2. 点击"验证不通过"\n3. 填写原因',
        'expected_result': '1. 状态变为重新打开\n2. 通知处理人\n3. 重新进入处理流程',
    },
    
    # 迭代管理 (6条)
    {
        'category_path': ('迭代管理', '迭代列表'),
        'name': '查看迭代列表',
        'module': '迭代管理',
        'feature': '迭代列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '空间存在迭代',
        'steps': '1. 进入空间\n2. 点击迭代Tab',
        'expected_result': '1. 显示迭代列表\n2. 显示时间范围\n3. 显示完成进度',
    },
    {
        'category_path': ('迭代管理', '迭代列表'),
        'name': '创建新迭代',
        'module': '迭代管理',
        'feature': '迭代列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户有创建权限',
        'steps': '1. 点击新建迭代\n2. 输入迭代名称\n3. 选择起止日期\n4. 保存',
        'expected_result': '1. 迭代创建成功\n2. 状态为未开始\n3. 可添加需求',
    },
    {
        'category_path': ('迭代管理', '迭代列表'),
        'name': '编辑迭代信息',
        'module': '迭代管理',
        'feature': '迭代列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '迭代未完成',
        'steps': '1. 点击迭代设置\n2. 修改名称或日期\n3. 保存',
        'expected_result': '1. 修改成功\n2. 已开始的迭代不能修改开始日期',
    },
    {
        'category_path': ('迭代管理', '迭代看板'),
        'name': '迭代看板拖拽需求',
        'module': '迭代管理',
        'feature': '迭代看板',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '迭代中有需求',
        'steps': '1. 进入迭代看板\n2. 将需求从"待处理"拖到"进行中"',
        'expected_result': '1. 拖拽成功\n2. 需求状态更新\n3. 列表即时刷新',
    },
    {
        'category_path': ('迭代管理', '迭代看板'),
        'name': '看板泳道切换',
        'module': '迭代管理',
        'feature': '迭代看板',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.LOW,
        'precondition': '迭代中有数据',
        'steps': '1. 切换为按处理人分组\n2. 切换为按类型分组',
        'expected_result': '1. 视图切换正常\n2. 数据重新分组\n3. 保持数据一致',
    },
    {
        'category_path': ('迭代管理', '燃尽图'),
        'name': '迭代燃尽图显示',
        'module': '迭代管理',
        'feature': '燃尽图',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '迭代进行中',
        'steps': '1. 进入迭代详情\n2. 查看燃尽图',
        'expected_result': '1. 显示理想线\n2. 显示实际完成线\n3. X轴为日期,Y轴为剩余工作量',
    },
    
    # 测试用例管理 (5条)
    {
        'category_path': ('测试用例', '用例列表'),
        'name': '查看测试用例列表',
        'module': '测试用例',
        'feature': '用例列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '空间存在测试用例',
        'steps': '1. 进入测试用例Tab\n2. 查看用例列表',
        'expected_result': '1. 显示用例目录树\n2. 显示用例列表\n3. 显示执行状态',
    },
    {
        'category_path': ('测试用例', '用例列表'),
        'name': '创建测试用例',
        'module': '测试用例',
        'feature': '用例列表',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '用户有创建权限',
        'steps': '1. 点击新建用例\n2. 填写用例名称\n3. 填写测试步骤\n4. 填写预期结果\n5. 保存',
        'expected_result': '1. 用例创建成功\n2. 自动生成用例编号\n3. 状态为未执行',
    },
    {
        'category_path': ('测试用例', '用例导入导出'),
        'name': '导出测试用例到Excel',
        'module': '测试用例',
        'feature': '用例导入导出',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '存在测试用例',
        'steps': '1. 点击导出按钮\n2. 选择导出范围\n3. 下载Excel文件',
        'expected_result': '1. 导出成功\n2. 包含所有字段\n3. 格式正确',
    },
    {
        'category_path': ('测试用例', '用例导入导出'),
        'name': '从Excel导入测试用例',
        'module': '测试用例',
        'feature': '用例导入导出',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.MEDIUM,
        'precondition': '准备符合模板的Excel文件',
        'steps': '1. 点击导入按钮\n2. 选择Excel文件\n3. 确认导入',
        'expected_result': '1. 导入成功\n2. 显示导入数量\n3. 错误行提示',
    },
    {
        'category_path': ('测试用例', '用例执行'),
        'name': '执行测试用例并记录结果',
        'module': '测试用例',
        'feature': '用例执行',
        'type': TestCaseType.FUNCTIONAL,
        'priority': TestCasePriority.HIGH,
        'precondition': '存在未执行的用例',
        'steps': '1. 打开用例详情\n2. 点击开始执行\n3. 逐步执行\n4. 标记通过/失败\n5. 填写实际结果',
        'expected_result': '1. 状态更新\n2. 记录执行人和时间\n3. 失败可关联缺陷',
    },
]


def clear_testcase_data(db, project: Project):
    """清除项目所有测试用例和目录"""
    # 清除历史记录
    testcase_ids = [tc.id for tc in db.query(TestCase).filter(TestCase.project_id == project.id).all()]
    if testcase_ids:
        db.query(TestCaseHistory).filter(TestCaseHistory.testcase_id.in_(testcase_ids)).delete(synchronize_session=False)
    
    # 清除测试用例
    db.query(TestCase).filter(TestCase.project_id == project.id).delete(synchronize_session=False)
    
    # 清除目录
    db.query(TestCaseCategory).filter(TestCaseCategory.project_id == project.id).delete(synchronize_session=False)
    
    db.flush()
    print(f"  - 已清除 {len(testcase_ids)} 条测试用例和相关目录")


def create_categories(db, project: Project) -> dict:
    """创建目录结构并返回路径到ID的映射"""
    category_map = {}  # (parent_name, name) -> id
    
    for parent_name, children in CATEGORIES.items():
        # 创建父目录
        parent = TestCaseCategory(
            project_id=project.id,
            parent_id=None,
            name=parent_name,
            order=0
        )
        db.add(parent)
        db.flush()
        category_map[(None, parent_name)] = parent.id
        
        # 创建子目录
        for idx, child_name in enumerate(children):
            child = TestCaseCategory(
                project_id=project.id,
                parent_id=parent.id,
                name=child_name,
                order=idx
            )
            db.add(child)
            db.flush()
            category_map[(parent_name, child_name)] = child.id
    
    db.flush()
    print(f"  - 已创建 {len(CATEGORIES)} 个一级目录和 {sum(len(v) for v in CATEGORIES.values())} 个二级目录")
    return category_map


def create_testcases(db, project: Project, user: User, category_map: dict):
    """创建测试用例"""
    statuses = [TestCaseStatus.NOT_EXECUTED, TestCaseStatus.PASSED, TestCaseStatus.FAILED]
    status_weights = [0.5, 0.35, 0.15]  # 未执行50%, 通过35%, 失败15%
    
    created_count = 0
    for tc_data in TEST_CASES:
        # 获取目录ID
        category_path = tc_data['category_path']
        category_id = category_map.get(category_path)
        
        # 随机状态
        status = random.choices(statuses, weights=status_weights)[0]
        
        # 创建测试用例
        testcase = TestCase(
            project_id=project.id,
            category_id=category_id,
            case_number="TEMP",
            name=tc_data['name'],
            module=tc_data.get('module', ''),
            feature=tc_data.get('feature', ''),
            type=tc_data.get('type', TestCaseType.FUNCTIONAL),
            status=status,
            priority=tc_data.get('priority', TestCasePriority.MEDIUM),
            precondition=tc_data.get('precondition', ''),
            steps=tc_data.get('steps', ''),
            expected_result=tc_data.get('expected_result', ''),
            creator_id=user.id
        )
        db.add(testcase)
        db.flush()
        
        # 更新用例编号
        testcase.case_number = f"TC{testcase.id}"
        created_count += 1
    
    db.flush()
    print(f"  - 已创建 {created_count} 条测试用例")


def main():
    db = SessionLocal()
    try:
        # 获取DEMO项目
        project = db.query(Project).filter(Project.key == PROJECT_KEY).first()
        if not project:
            print(f"错误: 未找到项目 {PROJECT_KEY}")
            return
        
        print(f"开始为项目 [{project.name}] 创建测试用例...")
        
        # 获取创建者
        user = db.query(User).filter(User.id == project.creator_id).first()
        if not user:
            user = db.query(User).first()
        
        # 清除现有数据
        print("清除现有测试用例数据...")
        clear_testcase_data(db, project)
        
        # 创建目录
        print("创建测试用例目录...")
        category_map = create_categories(db, project)
        
        # 创建测试用例
        print("创建测试用例...")
        create_testcases(db, project, user, category_map)
        
        db.commit()
        print("✅ 测试用例数据创建完成!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 错误: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
