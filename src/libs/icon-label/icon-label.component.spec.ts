import {ComponentFixture, TestBed} from '@angular/core/testing';

import {IconLabelComponent} from './icon-label.component';

describe('IconLabelComponent', () => {
  let component: IconLabelComponent;
  let fixture: ComponentFixture<IconLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconLabelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
