import { Component } from '@angular/core';
import { ApproverWorkspaceComponent } from '../approver-workspace/approver-workspace.component';

@Component({
  selector: 'app-approver-pending',
  imports: [ApproverWorkspaceComponent],
  template: `<app-approver-workspace mode="pending" />`,
})
export class ApproverPendingComponent {}
