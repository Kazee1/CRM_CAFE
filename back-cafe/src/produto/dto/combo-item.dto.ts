import { IsInt, Min } from 'class-validator';

export class ComboItemDto {
  @IsInt()
  produtoId: number;

  @IsInt()
  @Min(1)
  quantidade: number;
}
