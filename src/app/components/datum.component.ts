import {Component, inject, input, OnInit} from '@angular/core';

import {AngminService} from '../services/angmin.service';

@Component({
  selector: 'app-datum',
  standalone: true,
  imports: [],
  templateUrl: './datum.component.html',
  styleUrl: './datum.component.css',
})
export class DatumComponent implements OnInit {
  server = input.required<string>();
  item = input.required<string>();
  datum = input.required<string>();

  angminService = inject(AngminService);

  value = '';

  ngOnInit() {
    console.log(`Datum: ${this.server()}, ${this.item()}, ${this.datum()}`);

    this.angminService.getValue$(this.server(), this.item(), this.datum()).subscribe((value) => {
      this.value = value;
    });
  }
}
