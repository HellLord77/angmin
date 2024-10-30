import {NgClass} from '@angular/common';
import {Component, inject, input, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NavigationEnd, Router} from '@angular/router';
import {MenuItem, PrimeIcons} from 'primeng/api';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {Button, ButtonDirective} from 'primeng/button';
import {ButtonGroupModule} from 'primeng/buttongroup';
import {DividerModule} from 'primeng/divider';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputSwitchModule} from 'primeng/inputswitch';
import {MessagesModule} from 'primeng/messages';
import {SidebarModule} from 'primeng/sidebar';
import {TagModule} from 'primeng/tag';
import {ToastModule} from 'primeng/toast';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {ToolbarModule} from 'primeng/toolbar';

import {Theme} from '../enums/theme';
import {NotificationService} from '../services/notification.service';
import {VisualService} from '../services/visual.service';
import {IconLabelComponent} from './icon-label.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    BreadcrumbModule,
    TagModule,
    ToolbarModule,
    InputSwitchModule,
    FormsModule,
    Button,
    ButtonGroupModule,
    DividerModule,
    InputGroupModule,
    InputGroupAddonModule,
    ButtonDirective,
    ToastModule,
    SidebarModule,
    IconLabelComponent,
    MessagesModule,
    ToggleButtonModule,
    NgClass,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  server = input<string>();
  item = input<string>();
  datum = input<string>();

  router = inject(Router);
  visualService = inject(VisualService);
  notificationService = inject(NotificationService);

  sidebarVisible = false;
  home: MenuItem = {icon: PrimeIcons.HOME, routerLink: ['/']};

  scale!: number;
  theme!: Theme;
  notify!: boolean;

  navigationMenu?: MenuItem[];

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly Theme = Theme;

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const paths = event.url.split('/').filter(Boolean);
        if (paths.length) {
          const server = paths[0];
          this.navigationMenu = [{label: server, icon: PrimeIcons.DATABASE, routerLink: [server]}];
          if (paths.length > 1) {
            const item = paths[1];
            this.navigationMenu.push({
              label: item,
              icon: PrimeIcons.TABLE,
              routerLink: [server, item],
            });
            if (paths.length > 2) {
              const datum = paths[2];
              this.navigationMenu.push({
                label: datum,
                icon: PrimeIcons.FILE,
                routerLink: [server, item, datum],
              });
            }
          }
        } else {
          this.navigationMenu = undefined;
        }
      }
    });

    this.scale = this.visualService.storageService.getScale();
    this.theme = this.visualService.storageService.getTheme();
    this.notify = this.notificationService.storageService.getNotify();
  }

  decreaseScale() {
    this.visualService.setScale(--this.scale);
  }

  increaseScale() {
    this.visualService.setScale(++this.scale);
  }

  updateTheme() {
    this.visualService.setTheme(this.theme);
  }

  updateNotify() {
    this.notificationService.storageService.setNotify(this.notify);
  }
}
