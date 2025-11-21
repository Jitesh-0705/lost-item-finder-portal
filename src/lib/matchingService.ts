// lib/matchingService.ts
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

class MatchingService {
  private mobileNetModel: any;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing TensorFlow.js...');
      
      // Try to set backend to CPU first
      try {
        await tf.setBackend('cpu');
        console.log('TensorFlow.js backend set to: cpu');
      } catch (backendError) {
        console.warn('Could not set CPU backend, using default');
      }

      await tf.ready();
      console.log('TensorFlow.js is ready');

      console.log('Loading MobileNet model...');
      this.mobileNetModel = await mobilenet.load();
      this.isInitialized = true;
      console.log('MobileNet model loaded successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
      throw new Error(`Failed to initialize AI models: ${error}`);
    }
  }

  // Improved text similarity with better semantic understanding
  calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const clean1 = this.cleanText(text1);
    const clean2 = this.cleanText(text2);
    
    // Multiple similarity measures
    const jaccardScore = this.jaccardSimilarity(clean1, clean2);
    const wordOverlapScore = this.wordOverlapSimilarity(clean1, clean2);
    const keywordScore = this.keywordSimilarity(clean1, clean2);
    const lengthScore = this.lengthSimilarity(clean1, clean2);
    
    // Weighted combination
    const overallScore = (
      jaccardScore * 0.3 +
      wordOverlapScore * 0.4 +
      keywordScore * 0.2 +
      lengthScore * 0.1
    );
    
    console.log('Text similarity scores:', {
      jaccard: jaccardScore,
      wordOverlap: wordOverlapScore,
      keyword: keywordScore,
      length: lengthScore,
      overall: overallScore,
      text1: clean1,
      text2: clean2
    });
    
    return Math.min(1, Math.max(0, overallScore));
  }

  private cleanText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ')     // Collapse multiple spaces
      .trim();
  }

  private jaccardSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));
    
    if (tokens1.size === 0 || tokens2.size === 0) return 0;
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private wordOverlapSimilarity(text1: string, text2: string): number {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matches = 0;
    const maxLength = Math.max(words1.length, words2.length);
    
    // Check for word matches with stemming
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (this.areWordsSimilar(word1, word2)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / maxLength;
  }

  private keywordSimilarity(text1: string, text2: string): number {
    const keywords1 = this.extractKeywords(text1);
    const keywords2 = this.extractKeywords(text2);
    
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    let matches = 0;
    for (const kw1 of keywords1) {
      for (const kw2 of keywords2) {
        if (this.areWordsSimilar(kw1, kw2)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(keywords1.length, keywords2.length);
  }

  private lengthSimilarity(text1: string, text2: string): number {
    const len1 = text1.length;
    const len2 = text2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const maxLen = Math.max(len1, len2);
    const minLen = Math.min(len1, len2);
    
    // Similarity based on length ratio
    return minLen / maxLen;
  }

  private tokenize(text: string): string[] {
    return text
      .split(' ')
      .filter(word => word.length > 2)
      .map(word => this.stemWord(word));
  }

  private extractKeywords(text: string): string[] {
    // Common stop words to ignore
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'which', 'that', 'this', 'these',
      'those', 'then', 'than', 'when', 'where', 'why', 'how', 'what', 'who'
    ]);
    
    return this.tokenize(text)
      .filter(word => !stopWords.has(word) && word.length > 2);
  }

  private stemWord(word: string): string {
    // Simple stemming - remove common suffixes
    if (word.length <= 3) return word;
    
    if (word.endsWith('ing')) return word.slice(0, -3);
    if (word.endsWith('ed')) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
    if (word.endsWith('es')) return word.slice(0, -2);
    
    return word;
  }

  private areWordsSimilar(word1: string, word2: string): boolean {
    if (word1 === word2) return true;
    
    // Check for plural/singular
    if ((word1 + 's' === word2) || (word2 + 's' === word1)) return true;
    if ((word1 + 'es' === word2) || (word2 + 'es' === word1)) return true;
    
    // Check for common variations
    const variations = {
      'wallet': ['purse', 'money', 'cardholder'],
      'brown': ['tan', 'beige', 'dark'],
      'leather': ['fake', 'genuine', 'material'],
      'phone': ['mobile', 'cellphone', 'smartphone'],
      'keys': ['key', 'keychain', 'keyring'],
      'bag': ['purse', 'handbag', 'backpack'],
      'book': ['notebook', 'textbook', 'novel']
    };
    
    for (const [base, variants] of Object.entries(variations)) {
      if ((word1 === base && variants.includes(word2)) ||
          (word2 === base && variants.includes(word1))) {
        return true;
      }
    }
    
    // Check for substring matches (for partial words)
    if (word1.includes(word2) || word2.includes(word1)) {
      return Math.abs(word1.length - word2.length) <= 2;
    }
    
    return false;
  }

  // Image similarity using MobileNet
  async calculateImageSimilarity(imageUrl1: string, imageUrl2: string): Promise<number> {
    if (!this.isInitialized) await this.initialize();

    if (!imageUrl1 || !imageUrl2) {
      return 0;
    }

    try {
      const [img1, img2] = await Promise.all([
        this.loadImage(imageUrl1),
        this.loadImage(imageUrl2)
      ]);

      const [predictions1, predictions2] = await Promise.all([
        this.mobileNetModel.classify(img1),
        this.mobileNetModel.classify(img2)
      ]);

      return this.comparePredictions(predictions1, predictions2);
    } catch (error) {
      console.error('Error calculating image similarity:', error);
      return 0;
    }
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  private comparePredictions(pred1: any[], pred2: any[]): number {
    if (!pred1 || !pred2 || pred1.length === 0 || pred2.length === 0) {
      return 0;
    }

    let score = 0;
    const topN = Math.min(pred1.length, pred2.length, 3);
    
    for (let i = 0; i < topN; i++) {
      if (pred1[i] && pred2[i]) {
        const class1 = pred1[i].className.toLowerCase();
        const class2 = pred2[i].className.toLowerCase();
        
        const classSimilarity = this.calculateClassSimilarity(class1, class2);
        const probScore = (pred1[i].probability + pred2[i].probability) / 2;
        score += classSimilarity * probScore;
      }
    }
    
    return topN > 0 ? score / topN : 0;
  }

  private calculateClassSimilarity(class1: string, class2: string): number {
    const words1 = class1.split(',')[0].split(' '); // Take first description
    const words2 = class2.split(',')[0].split(' ');
    
    let matches = 0;
    for (const w1 of words1) {
      for (const w2 of words2) {
        if (this.areWordsSimilar(w1, w2)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  // Combined similarity score
  async calculateOverallSimilarity(
    report1: { title: string; description: string; image_url: string },
    report2: { title: string; description: string; image_url: string }
  ): Promise<{ score: number; textScore: number; imageScore: number }> {
    try {
      const fullText1 = `${report1.title} ${report1.description}`.trim();
      const fullText2 = `${report2.title} ${report2.description}`.trim();
      
      const textScore = this.calculateTextSimilarity(fullText1, fullText2);
      let imageScore = 0;
      
      if (report1.image_url && report2.image_url) {
        imageScore = await this.calculateImageSimilarity(report1.image_url, report2.image_url);
      }

      // Dynamic weighting based on content
      const hasImages = report1.image_url && report2.image_url;
      const textWeight = hasImages ? 0.6 : 0.9;
      const imageWeight = hasImages ? 0.4 : 0.1;
      
      const overallScore = (textScore * textWeight) + (imageScore * imageWeight);
      
      console.log('Overall similarity calculation:', {
        report1: fullText1,
        report2: fullText2,
        textScore,
        imageScore,
        overallScore,
        weights: { text: textWeight, image: imageWeight }
      });
      
      return {
        score: Math.min(1, Math.max(0, overallScore)),
        textScore: Math.min(1, Math.max(0, textScore)),
        imageScore: Math.min(1, Math.max(0, imageScore))
      };
    } catch (error) {
      console.error('Error in calculateOverallSimilarity:', error);
      // Fallback to basic text similarity
      const textScore = this.calculateTextSimilarity(
        `${report1.title} ${report1.description}`,
        `${report2.title} ${report2.description}`
      );
      
      return {
        score: textScore * 0.8,
        textScore,
        imageScore: 0
      };
    }
  }
}

export const matchingService = new MatchingService();