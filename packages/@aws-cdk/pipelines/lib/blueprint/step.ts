import { Stack, Token } from '@aws-cdk/core';
import { FileSet, IFileSetProducer } from './file-set';

/**
 * A generic Step which can be added to a Pipeline
 *
 * Steps can be used to add Sources, Build Actions and Validations
 * to your pipeline.
 *
 * This class is abstract. See specific subclasses of Step for
 * useful steps to add to your Pipeline
 */
export abstract class Step implements IFileSetProducer {
  /**
   * Define a sequence of steps to be executed in order.
   */
  public static sequence(steps: Step[]): Step[] {
    for (let i = 1; i < steps.length; i++) {
      steps[i].addStepDependency(steps[i-1]);
    }
    return steps;
  }

  /**
   * The list of FileSets consumed by this Step
   */
  public readonly dependencyFileSets: FileSet[] = [];

  /**
   * Whether or not this is a Source step
   *
   * What it means to be a Source step depends on the engine.
   */
  public readonly isSource: boolean = false;

  private _primaryOutput?: FileSet;

  private _dependencies: Step[] = [];

  constructor(
    /** Identifier for this step */
    public readonly id: string) {

    if (Token.isUnresolved(id)) {
      throw new Error(`Step id cannot be unresolved, got '${id}'`);
    }
  }

  /**
   * Return the steps this step depends on, based on the FileSets it requires
   */
  public get dependencies(): Step[] {
    return this.dependencyFileSets.map(f => f.producer).concat(this._dependencies);
  }

  /**
   * Return a string representation of this Step
   */
  public toString() {
    return `${this.constructor.name}(${this.id})`;
  }

  /**
   * The primary FileSet produced by this Step
   *
   * Not all steps produce an output FileSet--if they do
   * you can substitute the `Step` object for the `FileSet` object.
   */
  public get primaryOutput(): FileSet | undefined {
    // Accessor so it can be mutable in children
    return this._primaryOutput;
  }

  /**
   * Add a dependency on another step.
   */
  public addStepDependency(step: Step) {
    this._dependencies.push(step);
  }

  /**
   * Add an additional FileSet to the set of file sets required by this step
   *
   * This will lead to a dependency on the producer of that file set.
   */
  protected addDependencyFileSet(fs: FileSet) {
    this.dependencyFileSets.push(fs);
  }

  /**
   * Configure the given FileSet as the primary output of this step
   */
  protected configurePrimaryOutput(fs: FileSet) {
    this._primaryOutput = fs;
  }
}

/**
 * Instructions for additional steps that are run at stack level
 */
export interface StackSteps {
  /**
   * The stack you want the steps to run in
   */
  readonly stack: Stack;

  /**
   * Steps that execute before stack is prepared
   *
   * @default - no additional steps
   */
  readonly pre?: Step[];

  /**
   * Steps that execute after stack is prepared but before stack is deployed
   *
   * @default - no additional steps
   */
  readonly changeSet?: Step[];

  /**
   * Steps that execute after stack is deployed
   *
   * @default - no additional steps
   */
  readonly post?: Step[];

}