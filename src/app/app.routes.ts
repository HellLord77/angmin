import {Routes} from '@angular/router';

import {AngminComponent} from './components/angmin.component';
import {DatumComponent} from './components/datum.component';
import {ItemComponent} from './components/item.component';
import {ServerComponent} from './components/server.component';

export const routes: Routes = [
  {path: '', component: AngminComponent},
  {path: ':server', component: ServerComponent},
  {path: ':server/:item', component: ItemComponent},
  {path: ':server/:item/:datum', component: DatumComponent},
];
