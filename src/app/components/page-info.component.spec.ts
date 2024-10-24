import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PageInfoComponent} from './page-info.component';

describe('PageInfoComponent', () => {
  let component: PageInfoComponent;
  let fixture: ComponentFixture<PageInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
