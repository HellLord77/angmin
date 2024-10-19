import {TestBed} from '@angular/core/testing';

import {AngminService} from './angmin.service';

describe('AngminService', () => {
  let service: AngminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
