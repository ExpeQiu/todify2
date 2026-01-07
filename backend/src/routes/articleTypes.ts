import express from 'express';
import { formatApiResponse } from '../utils/validation';
import { articleTypeModel } from '../models/ArticleType';
import { CreateArticleTypeDTO, UpdateArticleTypeDTO } from '../models/ArticleType';

const router = express.Router();

/**
 * 获取所有文章类型
 * GET /api/v1/article-types
 */
router.get('/', async (req, res) => {
  try {
    const enabledOnly = req.query.enabled === 'true';
    const types = await articleTypeModel.findAll(enabledOnly);
    res.json(formatApiResponse(true, types, '获取文章类型列表成功'));
  } catch (error) {
    console.error('获取文章类型列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取文章类型列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 根据ID获取文章类型
 * GET /api/v1/article-types/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const type = await articleTypeModel.findById(id);
    
    if (!type) {
      return res.status(404).json(formatApiResponse(
        false,
        null,
        '文章类型不存在'
      ));
    }
    
    res.json(formatApiResponse(true, type, '获取文章类型成功'));
  } catch (error) {
    console.error('获取文章类型失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取文章类型失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 创建文章类型
 * POST /api/v1/article-types
 */
router.post('/', async (req, res) => {
  try {
    const data: CreateArticleTypeDTO = req.body;
    
    // 验证必填字段
    if (!data.code || !data.name) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        'code和name为必填字段'
      ));
    }
    
    // 检查code是否已存在
    const existing = await articleTypeModel.findByCode(data.code);
    if (existing) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        `code "${data.code}" 已存在`
      ));
    }
    
    const type = await articleTypeModel.create(data);
    res.status(201).json(formatApiResponse(true, type, '创建文章类型成功'));
  } catch (error) {
    console.error('创建文章类型失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '创建文章类型失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 更新文章类型
 * PUT /api/v1/article-types/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data: UpdateArticleTypeDTO = req.body;
    
    // 如果更新code，检查是否已存在
    if (data.code) {
      const existing = await articleTypeModel.findByCode(data.code);
      if (existing && existing.id !== id) {
        return res.status(400).json(formatApiResponse(
          false,
          null,
          `code "${data.code}" 已存在`
        ));
      }
    }
    
    const type = await articleTypeModel.update(id, data);
    
    if (!type) {
      return res.status(404).json(formatApiResponse(
        false,
        null,
        '文章类型不存在'
      ));
    }
    
    res.json(formatApiResponse(true, type, '更新文章类型成功'));
  } catch (error) {
    console.error('更新文章类型失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '更新文章类型失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除文章类型
 * DELETE /api/v1/article-types/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await articleTypeModel.delete(id);
    
    if (!success) {
      return res.status(404).json(formatApiResponse(
        false,
        null,
        '文章类型不存在'
      ));
    }
    
    res.json(formatApiResponse(true, null, '删除文章类型成功'));
  } catch (error) {
    console.error('删除文章类型失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '删除文章类型失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

