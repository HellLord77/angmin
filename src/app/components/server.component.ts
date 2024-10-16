import {Component, inject, input, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';

import {Items} from '../models/item.model';
import {ServerService} from '../services/server.service';

@Component({
  selector: 'app-server',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './server.component.html',
  styleUrl: './server.component.css',
})
export class ServerComponent implements OnInit {
  server = input.required<string>();

  serverService = inject(ServerService);

  items: Items = [];

  ngOnInit() {
    console.log(`Server: ${this.server()}`);

    this.serverService.getItems$(this.server()).subscribe((items) => {
      this.items = items;
    });
  }
}
