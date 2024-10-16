import {Component, input, OnInit} from '@angular/core';

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

  ngOnInit() {
    console.log(`Datum: ${this.server()}, ${this.item()}, ${this.datum()}`);
  }
}
