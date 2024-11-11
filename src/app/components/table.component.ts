import {Component, input, viewChild} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {PrimeIcons, PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {ToolbarModule} from 'primeng/toolbar';

import {columnsToValue} from '../functions/columnsToValue';
import {typeOf} from '../functions/typeOf';
import {Column} from '../models/column.model';
import {Datum} from '../models/datum.model';
import {TreeTableComponent} from './tree-table.component';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [Button, PrimeTemplate, ToolbarModule, TreeTableComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  host: {class: 'flex-column h-full'},
})
export class TableComponent {
  datum = input.required<Datum>();

  treeTableComponent = viewChild.required(TreeTableComponent);

  protected value: Column[] = [];

  protected readonly PrimeIcons = PrimeIcons;

  constructor() {
    toObservable(this.datum).subscribe(() => {
      this.treeTableComponent().collapseAll();

      this.value = this.getColumns();
    });
  }

  getValue() {
    return columnsToValue(this.value) as unknown as Datum;
  }

  protected getColumns(obj: object = this.datum()) {
    const entries: [string, object][] = Array.isArray(obj)
      ? obj.map((value, index) => [index.toString(), value])
      : Object.entries(obj);

    return entries.map(([name, value]) => {
      const column: Column = {name, type: typeOf(value), value};
      if (value !== null && typeof value === 'object') {
        column.columns = this.getColumns(value);
      }
      return column;
    });
  }

  protected clear() {
    const value: Datum = {id: this.datum().id};
    this.value = this.getColumns(value);
  }
}
