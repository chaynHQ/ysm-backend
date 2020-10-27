import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import StoryblokClient from 'storyblok-js-client';
import { PreviewMode } from './preview-mode/preview-mode.decorator';
import { PreviewModeGuard } from './preview-mode/preview-mode.guard';
import { STORYBLOK_CLIENT } from './storyblok/storyblok-factory';

@Controller()
export class AppController {
  constructor(@Inject(STORYBLOK_CLIENT) private storyblok: StoryblokClient) {}

  @Get('/')
  @UseGuards(PreviewModeGuard)
  root(@PreviewMode() previewMode: boolean): any {
    // Root level API endpoint that we can use for things like uptime checks
    if (previewMode) {
      return { previewMode };
    } else {
      return {};
    }
  }

  @Get('flush_cache')
  async flushCache(): Promise<void> {
    await this.storyblok.flushCache();
  }
}
