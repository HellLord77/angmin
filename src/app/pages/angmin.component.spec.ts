import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AngminComponent} from './angmin.component';

describe('AngminComponent', () => {
  let component: AngminComponent;
  let fixture: ComponentFixture<AngminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngminComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
