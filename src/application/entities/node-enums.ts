export enum GenerationStatusEnum {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum AspectRatioEnum {
  '1:1' = '1:1',
  '1:4' = '1:4',
  '1:8' = '1:8',
  '2:3' = '2:3',
  '3:2' = '3:2',
  '3:4' = '3:4',
  '4:1' = '4:1',
  '4:3' = '4:3',
  '4:5' = '4:5',
  '5:4' = '5:4',
  '8:1' = '8:1',
  '9:16' = '9:16',
  '16:9' = '16:9',
  '21:9' = '21:9',
}

export enum QualityEnum {
  '0.5K' = '0.5K',
  '1K' = '1K',
  '2K' = '2K',
  '4K' = '4K',
}

export enum ImageSizeEnum {
  SQUARE_HD = 'square_hd',
  SQUARE = 'square',
  PORTRAIT_4_3 = 'portrait_4_3',
  PORTRAIT_16_9 = 'portrait_16_9',
  LANDSCAPE_4_3 = 'landscape_4_3',
  LANDSCAPE_16_9 = 'landscape_16_9',
}

export enum UpscaleModelEnum {
  REAL_ESRGAN_X4PLUS = 'RealESRGAN_x4plus',
  REAL_ESRGAN_X2PLUS = 'RealESRGAN_x2plus',
  REAL_ESRGAN_X4PLUS_ANIME = 'RealESRGAN_x4plus_anime_6B',
}

export enum VideoResolutionEnum {
  '1080p' = '1080p',
  '1440p' = '1440p',
  '2160p' = '2160p',
}

export enum VideoAspectRatioEnum {
  AUTO = 'auto',
  '16:9' = '16:9',
  '9:16' = '9:16',
  '1:1' = '1:1',
}

export enum VideoDurationEnum {
  S3 = '3',
  S4 = '4',
  S5 = '5',
  S6 = '6',
  S7 = '7',
  S8 = '8',
  S9 = '9',
  S10 = '10',
}

export enum VideoTierEnum {
  STANDARD = 'standard',
  PREMIUM = 'premium',
}
