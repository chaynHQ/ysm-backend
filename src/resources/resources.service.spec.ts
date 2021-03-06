import { Test, TestingModule } from '@nestjs/testing';
import StoryblokClient from 'storyblok-js-client';
import { mocked } from 'ts-jest/utils';
import { STORYBLOK_CLIENT } from '../storyblok/storyblok-factory';
import { FiltersService } from './filters.service';
import { ResourceSerialiserService } from './resource-serialiser.service';
import { ResourcesService } from './resources.service';

jest.mock('storyblok-js-client');
const mockedStoryblokClient = mocked(StoryblokClient, true);

describe('ResourcesService', () => {
  let service: ResourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: STORYBLOK_CLIENT, useValue: mockedStoryblokClient },
        FiltersService,
        ResourceSerialiserService,
        ResourcesService,
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
