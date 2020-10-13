import { Controller, Get, HttpCode, Inject } from '@nestjs/common';
import StoryblokClient from 'storyblok-js-client';
import { STORYBLOK_CLIENT } from './storyblok/storyblok-factory';

@Controller()
export class AppController {
  constructor(@Inject(STORYBLOK_CLIENT) private storyblok: StoryblokClient) {}

  @Get('/')
  @HttpCode(204)
  root(): void {
    // Root level API endpoint that we can use for things like uptime checks
  }

  @Get('flush_cache')
  async flushCache(): Promise<void> {
    await this.storyblok.flushCache();
  }
}
