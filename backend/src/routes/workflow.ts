import express from 'express';
import DifyClient from '../services/DifyClient';

const router = express.Router();

// 运行智能搜索工作流
router.post('/smart-search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    const result = await DifyClient.runWorkflow('smart-search-workflow', {
      query: query
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Smart search error:', error);
    res.status(500).json({ 
      success: false, 
      error: '智能搜索失败，请稍后重试' 
    });
  }
});

// 运行技术包装工作流
router.post('/tech-package', async (req, res) => {
  try {
    const { searchResults } = req.body;
    
    const result = await DifyClient.runWorkflow('tech-package-workflow', {
      searchResults: searchResults
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Tech package error:', error);
    res.status(500).json({ 
      success: false, 
      error: '技术包装生成失败，请稍后重试' 
    });
  }
});

// 运行推广策略工作流
router.post('/promotion-strategy', async (req, res) => {
  try {
    const { techPackage } = req.body;
    
    const result = await DifyClient.runWorkflow('promotion-strategy-workflow', {
      techPackage: techPackage
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Promotion strategy error:', error);
    res.status(500).json({ 
      success: false, 
      error: '推广策略生成失败，请稍后重试' 
    });
  }
});

// 运行核心稿件工作流
router.post('/core-draft', async (req, res) => {
  try {
    const { promotionStrategy, techPackage } = req.body;
    
    const result = await DifyClient.runWorkflow('core-draft-workflow', {
      promotionStrategy: promotionStrategy,
      techPackage: techPackage
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Core draft error:', error);
    res.status(500).json({ 
      success: false, 
      error: '核心稿件生成失败，请稍后重试' 
    });
  }
});

// 运行演讲稿工作流
router.post('/speech', async (req, res) => {
  try {
    const { coreDraft } = req.body;
    
    const result = await DifyClient.runWorkflow('speech-workflow', {
      coreDraft: coreDraft
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Speech generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: '演讲稿生成失败，请稍后重试' 
    });
  }
});

export default router;