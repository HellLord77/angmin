import {Component, inject, input, OnInit} from '@angular/core';

import {DatumService} from '../services/datum.service';

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

  datumService = inject(DatumService);

  string_ = '';

  ngOnInit() {
    console.log(`Datum: ${this.server()}, ${this.item()}, ${this.datum()}`);

    this.datumService.getString$(this.server(), this.item(), this.datum()).subscribe((string_) => {
      this.string_ = string_;
    });
  }
}
