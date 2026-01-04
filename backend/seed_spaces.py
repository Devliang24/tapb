"""
Seed 20 example public spaces representing different industries/domains
Run this script to populate the database with example spaces for demonstration
"""
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import (
    Project, Sprint, Requirement, Bug,
    SprintStatus, RequirementStatus, RequirementPriority,
    BugStatus, BugPriority, BugSeverity, User
)


# 20个示例空间定义
EXAMPLE_SPACES = [
    {
        "key": "ECOM",
        "name": "电商平台",
        "description": "在线购物系统 - 包含商品管理、购物车、订单处理、支付集成等核心电商功能",
        "bugs": [
            {"title": "商品详情页图片加载缓慢", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "购物车数量同步异常", "status": BugStatus.NEW, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "优惠券无法正常使用", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "订单状态更新延迟", "status": BugStatus.RESOLVED, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 商品模块", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 订单支付", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 营销活动", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "商品SKU管理功能", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "多规格商品选择器", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "积分兑换功能", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "SOCIAL",
        "name": "社交媒体",
        "description": "社交网络应用 - 用户动态、好友关系、消息系统、内容分享等社交核心功能",
        "bugs": [
            {"title": "消息推送延迟严重", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "头像上传失败", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "好友列表显示不全", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "动态点赞数不准确", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.TRIVIAL},
        ],
        "sprints": [
            {"name": "Sprint 1 - 用户系统", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 动态发布", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 即时通讯", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "朋友圈功能", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "私信聊天功能", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "话题标签系统", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "FINTECH",
        "name": "金融科技",
        "description": "支付与理财平台 - 电子钱包、转账汇款、理财产品、账户管理等金融服务",
        "bugs": [
            {"title": "转账金额显示精度问题", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "账单导出格式错误", "status": BugStatus.NEW, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
            {"title": "理财收益计算偏差", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "银行卡绑定流程卡顿", "status": BugStatus.RESOLVED, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 账户体系", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 支付核心", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 理财模块", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "实名认证流程", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "快捷支付功能", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "定期理财产品", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "EDU",
        "name": "在线教育",
        "description": "学习管理系统 - 课程管理、在线直播、作业考试、学习进度追踪等教育功能",
        "bugs": [
            {"title": "视频播放卡顿", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "考试倒计时不同步", "status": BugStatus.NEW, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "课程进度保存失败", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "证书下载按钮无响应", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 课程中心", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 直播互动", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 考试系统", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "视频课程播放器", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "直播连麦功能", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "智能题库系统", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "HEALTH",
        "name": "医疗健康",
        "description": "医疗服务平台 - 在线问诊、预约挂号、健康档案、药品配送等医疗健康服务",
        "bugs": [
            {"title": "预约时间段显示错误", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "处方图片上传失败", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "医生排班数据不同步", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "健康报告PDF生成异常", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 问诊系统", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 预约挂号", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 健康管理", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "图文问诊功能", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "智能分诊系统", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "电子病历管理", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "LOGIS",
        "name": "物流配送",
        "description": "物流管理系统 - 运单管理、路线规划、仓储管理、配送追踪等物流核心功能",
        "bugs": [
            {"title": "物流轨迹更新延迟", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "运费计算不准确", "status": BugStatus.NEW, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "扫码枪兼容性问题", "status": BugStatus.CONFIRMED, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "批量打印面单失败", "status": BugStatus.RESOLVED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 运单系统", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 仓储管理", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 智能调度", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "电子面单打印", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "路线智能规划", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "仓储库位管理", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "FOOD",
        "name": "餐饮外卖",
        "description": "订餐配送平台 - 菜品管理、在线点餐、骑手调度、订单配送等外卖服务",
        "bugs": [
            {"title": "菜品库存不同步", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "配送时间预估不准", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "骑手定位漂移", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "优惠活动叠加计算错误", "status": BugStatus.RESOLVED, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
        ],
        "sprints": [
            {"name": "Sprint 1 - 商家入驻", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 点餐系统", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 配送调度", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "菜品分类管理", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "智能推荐系统", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "骑手抢单功能", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "TRAVEL",
        "name": "旅游出行",
        "description": "旅行预订平台 - 机票酒店预订、景点门票、行程规划、旅游攻略等出行服务",
        "bugs": [
            {"title": "机票价格波动显示延迟", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "酒店房型图片加载失败", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "行程日历同步异常", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "退款进度查询超时", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 机票预订", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 酒店系统", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 行程规划", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "机票比价功能", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "酒店筛选排序", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "智能行程生成", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "REALTY",
        "name": "房产租赁",
        "description": "房产管理系统 - 房源发布、在线看房、租赁签约、物业管理等房产服务",
        "bugs": [
            {"title": "VR看房加载缓慢", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "房源定位不准确", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "电子合同签署失败", "status": BugStatus.CONFIRMED, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "房租提醒通知延迟", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 房源管理", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 在线签约", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 物业服务", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "房源信息发布", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "VR全景看房", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "智能房源推荐", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "HRMS",
        "name": "人力资源",
        "description": "HR管理系统 - 招聘管理、员工档案、考勤薪酬、绩效考核等人力资源管理",
        "bugs": [
            {"title": "考勤打卡定位偏差", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "工资条发送失败", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "请假审批流程卡住", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "简历解析不完整", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 员工档案", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 考勤系统", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 绩效管理", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "组织架构管理", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "智能排班系统", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "360度绩效评估", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "OA",
        "name": "企业OA",
        "description": "办公自动化系统 - 流程审批、公文管理、会议室预订、企业通讯等办公协同",
        "bugs": [
            {"title": "审批流程超时", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "会议通知发送延迟", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "文档权限设置无效", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "日程同步不及时", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 审批流程", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 文档管理", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 协同办公", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "可视化流程设计", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "智能表单引擎", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "移动办公支持", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "CRM",
        "name": "客户关系",
        "description": "CRM系统 - 客户管理、销售漏斗、商机跟进、数据分析等客户关系管理",
        "bugs": [
            {"title": "客户数据导入失败", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "跟进提醒不触发", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "销售报表统计错误", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "公海池分配异常", "status": BugStatus.RESOLVED, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
        ],
        "sprints": [
            {"name": "Sprint 1 - 客户管理", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 销售流程", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 数据分析", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "客户360度视图", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "销售漏斗分析", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "智能销售预测", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "BI",
        "name": "数据分析",
        "description": "BI分析平台 - 数据可视化、报表设计、多维分析、数据大屏等商业智能服务",
        "bugs": [
            {"title": "图表渲染性能差", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "数据源连接超时", "status": BugStatus.NEW, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "报表导出格式错乱", "status": BugStatus.CONFIRMED, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "权限过滤不生效", "status": BugStatus.RESOLVED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 数据连接", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 可视化组件", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 报表设计器", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "多数据源接入", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "拖拽式报表设计", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "智能数据洞察", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "CMS",
        "name": "内容管理",
        "description": "CMS系统 - 内容发布、栏目管理、模板设计、多端适配等内容管理服务",
        "bugs": [
            {"title": "富文本编辑器兼容性", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "图片压缩质量问题", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "SEO设置不生效", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "定时发布失败", "status": BugStatus.RESOLVED, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 内容管理", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 模板系统", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 多端发布", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "可视化编辑器", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "模板市场功能", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "内容智能推荐", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "GAME",
        "name": "游戏平台",
        "description": "游戏社区系统 - 游戏中心、社区互动、成就系统、虚拟道具等游戏平台功能",
        "bugs": [
            {"title": "游戏启动崩溃", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "排行榜数据延迟", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "好友对战匹配超时", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "道具购买重复扣费", "status": BugStatus.RESOLVED, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
        ],
        "sprints": [
            {"name": "Sprint 1 - 游戏中心", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 社区系统", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 商城系统", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "游戏启动器", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "实时对战系统", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "虚拟货币系统", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "IOT",
        "name": "智能硬件",
        "description": "IoT设备管理 - 设备接入、数据采集、远程控制、固件升级等物联网管理功能",
        "bugs": [
            {"title": "设备离线状态不同步", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "固件升级中断", "status": BugStatus.NEW, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "传感器数据丢失", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "告警通知重复发送", "status": BugStatus.RESOLVED, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 设备接入", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 数据中心", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 智能联动", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "多协议设备接入", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "实时数据监控", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "智能场景联动", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "LIVE",
        "name": "视频直播",
        "description": "直播互动平台 - 直播推流、弹幕互动、礼物打赏、直播回放等直播功能",
        "bugs": [
            {"title": "直播画面卡顿", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "弹幕显示延迟", "status": BugStatus.NEW, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "礼物特效不显示", "status": BugStatus.CONFIRMED, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "回放视频无法播放", "status": BugStatus.RESOLVED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 直播核心", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 互动功能", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 变现系统", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "多清晰度推流", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "实时弹幕系统", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "PK连麦功能", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "COURSE",
        "name": "知识付费",
        "description": "课程销售平台 - 知识商品、订阅会员、分销体系、学习社群等知识变现服务",
        "bugs": [
            {"title": "课程购买支付失败", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
            {"title": "会员权益显示错误", "status": BugStatus.NEW, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "分销佣金计算偏差", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "课程评价无法提交", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 课程系统", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 会员体系", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 分销系统", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "课程内容加密", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "多级分销体系", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "学习社群功能", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "FORUM",
        "name": "社区论坛",
        "description": "用户讨论平台 - 帖子发布、板块管理、用户等级、内容审核等社区功能",
        "bugs": [
            {"title": "帖子发布失败", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "图片上传大小限制问题", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "@用户通知不到达", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "搜索结果不准确", "status": BugStatus.RESOLVED, "priority": BugPriority.LOW, "severity": BugSeverity.MINOR},
        ],
        "sprints": [
            {"name": "Sprint 1 - 内容发布", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 用户体系", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - 内容审核", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "Markdown编辑器", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "用户等级系统", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "AI内容审核", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
    {
        "key": "OPENSOURCE",
        "name": "开源项目",
        "description": "代码协作平台 - 代码托管、Issue跟踪、PR管理、CI/CD集成等开源协作功能",
        "bugs": [
            {"title": "代码diff显示错误", "status": BugStatus.IN_PROGRESS, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "大文件上传失败", "status": BugStatus.NEW, "priority": BugPriority.MEDIUM, "severity": BugSeverity.MINOR},
            {"title": "Webhook触发不稳定", "status": BugStatus.CONFIRMED, "priority": BugPriority.HIGH, "severity": BugSeverity.MAJOR},
            {"title": "CI流水线卡住", "status": BugStatus.RESOLVED, "priority": BugPriority.CRITICAL, "severity": BugSeverity.CRITICAL},
        ],
        "sprints": [
            {"name": "Sprint 1 - 代码托管", "status": SprintStatus.COMPLETED},
            {"name": "Sprint 2 - 协作功能", "status": SprintStatus.ACTIVE},
            {"name": "Sprint 3 - CI/CD", "status": SprintStatus.PLANNING},
        ],
        "requirements": [
            {"title": "Git仓库管理", "status": RequirementStatus.COMPLETED, "priority": RequirementPriority.HIGH},
            {"title": "代码审查流程", "status": RequirementStatus.IN_PROGRESS, "priority": RequirementPriority.HIGH},
            {"title": "自动化流水线", "status": RequirementStatus.DRAFT, "priority": RequirementPriority.MEDIUM},
        ]
    },
]


def get_or_create_system_user(db: Session) -> User:
    """Get or create a system user for public spaces"""
    system_user = db.query(User).filter(User.username == "system").first()
    if not system_user:
        from app.utils.security import get_password_hash
        system_user = User(
            username="system",
            email="system@tapb.local",
            password_hash=get_password_hash("system_internal_user_2026"),
            role="admin"
        )
        db.add(system_user)
        db.commit()
        db.refresh(system_user)
        print("✅ Created system user")
    return system_user


def seed_example_spaces():
    """Seed 20 example public spaces"""
    db = SessionLocal()
    
    try:
        # Get or create system user
        system_user = get_or_create_system_user(db)
        
        created_count = 0
        skipped_count = 0
        
        for space_data in EXAMPLE_SPACES:
            # Check if space already exists
            existing = db.query(Project).filter(Project.key == space_data["key"]).first()
            if existing:
                print(f"⏭️  Space {space_data['key']} already exists, skipping...")
                skipped_count += 1
                continue
            
            # Create project
            project = Project(
                name=space_data["name"],
                key=space_data["key"],
                description=space_data["description"],
                is_public=True,
                creator_id=system_user.id,
                bug_seq=0,
                requirement_seq=0,
                task_seq=0
            )
            db.add(project)
            db.flush()
            
            # Create sprints
            sprint_map = {}
            for i, sprint_data in enumerate(space_data["sprints"]):
                sprint = Sprint(
                    project_id=project.id,
                    name=sprint_data["name"],
                    goal=f"{space_data['name']}项目{sprint_data['name']}目标",
                    status=sprint_data["status"],
                    start_date=date(2026, 1 + i, 1),
                    end_date=date(2026, 1 + i, 14),
                )
                db.add(sprint)
                db.flush()
                sprint_map[i] = sprint
            
            # Create bugs
            for i, bug_data in enumerate(space_data["bugs"], 1):
                project.bug_seq = i
                bug = Bug(
                    project_id=project.id,
                    bug_number=f"{project.key}-{str(i).zfill(3)}",
                    title=bug_data["title"],
                    description=f"## 问题描述\n{bug_data['title']}\n\n## 复现步骤\n1. 进入相关页面\n2. 执行相关操作\n3. 观察问题现象",
                    status=bug_data["status"],
                    priority=bug_data["priority"],
                    severity=bug_data["severity"],
                    creator_id=system_user.id,
                    sprint_id=sprint_map.get(1, sprint_map[0]).id if sprint_map else None
                )
                db.add(bug)
            
            # Create requirements
            for i, req_data in enumerate(space_data["requirements"], 1):
                project.requirement_seq = i
                requirement = Requirement(
                    project_id=project.id,
                    requirement_number=f"{project.key}-REQ-{str(i).zfill(3)}",
                    title=req_data["title"],
                    description=f"## 需求描述\n{req_data['title']}\n\n## 验收标准\n- 功能完整可用\n- 通过测试验证",
                    status=req_data["status"],
                    priority=req_data["priority"],
                    creator_id=system_user.id,
                    sprint_id=sprint_map.get(i-1, sprint_map[0]).id if sprint_map else None
                )
                db.add(requirement)
            
            created_count += 1
            print(f"✅ Created space: {space_data['name']} ({space_data['key']})")
        
        db.commit()
        print(f"\n✨ Seed completed! Created {created_count} spaces, skipped {skipped_count} existing.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding spaces: {e}")
        raise
    finally:
        db.close()


def clear_example_spaces():
    """Clear all public example spaces (use with caution)"""
    db = SessionLocal()
    
    try:
        # Delete all public projects
        public_projects = db.query(Project).filter(Project.is_public == True).all()
        count = len(public_projects)
        
        for project in public_projects:
            db.delete(project)
        
        db.commit()
        print(f"🗑️  Deleted {count} public example spaces")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error clearing spaces: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        print("⚠️  Clearing all public example spaces...")
        clear_example_spaces()
    else:
        print("🌱 Seeding example spaces...")
        seed_example_spaces()
