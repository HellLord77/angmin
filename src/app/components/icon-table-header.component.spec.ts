import {ComponentFixture, TestBed} from '@angular/core/testing';

import {IconTableHeaderComponent} from './icon-table-header.component';

describe('IconTableHeaderComponent', () => {
  let component: IconTableHeaderComponent;
  let fixture: ComponentFixture<IconTableHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconTableHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconTableHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
