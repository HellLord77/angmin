import {Component, inject, input, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';

import {Data} from '../models/datum.model';
import {ItemService} from '../services/item.service';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [ButtonModule, DialogModule, InputTextModule, RouterLink],
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
})
export class ItemComponent implements OnInit {
  protected readonly JSON = JSON;

  server = input.required<string>();
  item = input.required<string>();

  itemService = inject(ItemService);

  data: Data = [];

  ngOnInit() {
    console.log(`Item: ${this.server()}, ${this.item()}`);

    this.itemService.getData$(this.server(), this.item()).subscribe((data) => {
      this.data = data;
    });
  }
}
