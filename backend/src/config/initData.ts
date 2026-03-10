import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Activity from '../models/Activity';

// 加载环境变量
dotenv.config();

// MongoDB 连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vue3-vant-db';

// 初始化数据
const initData = async () => {
  try {
    console.log('开始初始化数据库数据...');
    
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 连接成功');
    
    // 1. 初始化用户数据
    await initUsers();
    
    // 2. 初始化商品分类数据
    await initCategories();
    
    // 3. 初始化商品数据
    await initProducts();
    
    // 4. 初始化活动数据
    await initActivities();
    
    console.log('数据库初始化完成！');
    
    // 断开连接
    await mongoose.disconnect();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

// 初始化用户数据
const initUsers = async () => {
  console.log('初始化用户数据...');
  
  // 检查是否已有用户数据
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('用户数据已存在，跳过初始化');
    return;
  }
  
  // 创建管理员用户
  const adminUser = new User({
    username: 'admin',
    password: '123456',
    email: 'admin@example.com',
    avatar: 'https://via.placeholder.com/150',
    roles: ['admin'],
    permissions: ['*:*:*'],
    status: 'active'
  });
  
  // 创建普通用户
  const normalUser = new User({
    username: 'user',
    password: '123456',
    email: 'user@example.com',
    avatar: 'https://via.placeholder.com/150',
    roles: ['user'],
    permissions: ['user:read', 'product:read', 'order:read', 'activity:read'],
    status: 'active'
  });
  
  await adminUser.save();
  await normalUser.save();
  
  console.log('用户数据初始化完成');
};

// 初始化商品分类数据
const initCategories = async () => {
  console.log('初始化商品分类数据...');
  
  // 检查是否已有分类数据
  const categoryCount = await Category.countDocuments();
  if (categoryCount > 0) {
    console.log('商品分类数据已存在，跳过初始化');
    return;
  }
  
  // 创建分类数据
  const categories = [
    { name: '手机数码', parentId: null, sort: 1 },
    { name: '电脑办公', parentId: null, sort: 2 },
    { name: '家用电器', parentId: null, sort: 3 },
    { name: '服装鞋包', parentId: null, sort: 4 },
    { name: '食品生鲜', parentId: null, sort: 5 },
    { name: '美妆个护', parentId: null, sort: 6 },
    { name: '运动户外', parentId: null, sort: 7 },
    { name: '图书音像', parentId: null, sort: 8 }
  ];
  
  await Category.insertMany(categories);
  console.log('商品分类数据初始化完成');
};

// 初始化商品数据
const initProducts = async () => {
  console.log('初始化商品数据...');
  
  // 检查是否已有商品数据
  const productCount = await Product.countDocuments();
  if (productCount > 0) {
    console.log('商品数据已存在，跳过初始化');
    return;
  }
  
  // 获取分类
  const categories = await Category.find();
  if (categories.length === 0) {
    console.log('分类数据不存在，跳过商品初始化');
    return;
  }
  
  // 创建商品数据
  const products = [
    {
      name: 'iPhone 15 Pro Max',
      description: '最新款苹果手机，搭载 A17 Pro 芯片，支持 USB-C 接口',
      price: 9999,
      stock: 50,
      categoryId: categories[0]._id,
      images: [
        'https://via.placeholder.com/300x300?text=iPhone+15+Pro+Max',
        'https://via.placeholder.com/300x300?text=iPhone+15+Pro+Max+Back'
      ],
      status: 'active'
    },
    {
      name: 'MacBook Pro 16',
      description: '专业级笔记本电脑，M3 Pro 芯片，16GB 内存',
      price: 18999,
      stock: 30,
      categoryId: categories[1]._id,
      images: [
        'https://via.placeholder.com/300x300?text=MacBook+Pro+16',
        'https://via.placeholder.com/300x300?text=MacBook+Pro+16+Open'
      ],
      status: 'active'
    },
    {
      name: '小米空气净化器',
      description: '智能空气净化器，支持 WiFi 控制，除霾除甲醛',
      price: 899,
      stock: 100,
      categoryId: categories[2]._id,
      images: [
        'https://via.placeholder.com/300x300?text=Xiaomi+Air+Purifier'
      ],
      status: 'active'
    },
    {
      name: 'Nike Air Max',
      description: '经典运动鞋，舒适透气，时尚百搭',
      price: 799,
      stock: 80,
      categoryId: categories[3]._id,
      images: [
        'https://via.placeholder.com/300x300?text=Nike+Air+Max'
      ],
      status: 'active'
    },
    {
      name: '新鲜水果礼盒',
      description: '精选时令水果，新鲜直达，送礼佳品',
      price: 199,
      stock: 200,
      categoryId: categories[4]._id,
      images: [
        'https://via.placeholder.com/300x300?text=Fruit+Gift+Box'
      ],
      status: 'active'
    }
  ];
  
  await Product.insertMany(products);
  console.log('商品数据初始化完成');
};

// 初始化活动数据
const initActivities = async () => {
  console.log('初始化活动数据...');
  
  // 检查是否已有活动数据
  const activityCount = await Activity.countDocuments();
  if (activityCount > 0) {
    console.log('活动数据已存在，跳过初始化');
    return;
  }
  
  // 创建活动数据
  const activities = [
    {
      title: '新品发布会',
      description: '最新产品发布会，邀请您参加',
      startTime: new Date('2026-02-10T10:00:00'),
      endTime: new Date('2026-02-10T12:00:00'),
      location: '北京市朝阳区某某大厦',
      image: 'https://via.placeholder.com/800x400?text=New+Product+Launch',
      status: 'upcoming'
    },
    {
      title: '春节促销活动',
      description: '春节大促，全场商品8折起',
      startTime: new Date('2026-02-05T00:00:00'),
      endTime: new Date('2026-02-15T23:59:59'),
      location: '线上活动',
      image: 'https://via.placeholder.com/800x400?text=Spring+Festival+Sale',
      status: 'ongoing'
    },
    {
      title: '年终总结大会',
      description: '2025年年终总结大会',
      startTime: new Date('2025-12-30T09:00:00'),
      endTime: new Date('2025-12-30T17:00:00'),
      location: '上海市浦东新区某某酒店',
      image: 'https://via.placeholder.com/800x400?text=Year+End+Meeting',
      status: 'ended'
    }
  ];
  
  await Activity.insertMany(activities);
  console.log('活动数据初始化完成');
};

// 执行初始化
if (require.main === module) {
  initData();
}

export default initData;