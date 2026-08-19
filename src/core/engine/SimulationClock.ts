export class SimulationClock {
  private elapsed = 0;

  public advance(deltaMs: number): number {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      throw new Error('deltaMs must be a finite, non-negative number.');
    }
    this.elapsed += deltaMs;
    return this.elapsed;
  }

  public reset(): void {
    this.elapsed = 0;
  }

  public get elapsedMs(): number {
    return this.elapsed;
  }
}
