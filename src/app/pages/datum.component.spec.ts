import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DatumComponent} from './datum.component';

describe('DatumComponent', () => {
  let component: DatumComponent;
  let fixture: ComponentFixture<DatumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatumComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
