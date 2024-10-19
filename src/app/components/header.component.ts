import {Component, inject, input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MenuItem, PrimeIcons} from 'primeng/api';
import {BreadcrumbModule} from 'primeng/breadcrumb';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [BreadcrumbModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  server = input<string>();
  item = input<string>();
  datum = input<string>();

  activatedRoute = inject(ActivatedRoute);

  home: MenuItem = {icon: PrimeIcons.HOME, routerLink: ['/']};

  navigationMenu?: MenuItem[];

  ngOnInit() {
    console.log(JSON.stringify(this.activatedRoute.snapshot.params));
    const navigationMenu: MenuItem[] = [];

    const server = this.server();
    if (server) {
      navigationMenu.push({label: server, icon: PrimeIcons.DATABASE, routerLink: [server]});
    }

    const item = this.item();
    if (item) {
      navigationMenu.push({label: item, icon: PrimeIcons.TABLE, routerLink: [server, item]});
    }

    const datum = this.datum();
    if (datum) {
      navigationMenu.push({label: datum, routerLink: [server, item, datum]});
    }

    if (navigationMenu.length) {
      this.navigationMenu = navigationMenu;
    }

    console.log(`Header: ${server}, ${item}, ${datum}`);
  }
}
