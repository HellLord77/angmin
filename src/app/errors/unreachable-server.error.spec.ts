import {UnreachableServer} from './unreachable-server.error';

describe('UnreachableServer', () => {
  it('should create an instance', () => {
    expect(new UnreachableServer()).toBeTruthy();
  });
});
