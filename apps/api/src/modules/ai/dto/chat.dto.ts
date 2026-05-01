import { IsString, IsArray, IsOptional, IsEnum, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessage {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content: string;
}

export class ChatDto {
  @ApiProperty({ example: 'Şirketimin stres seviyesi hakkında ne düşünüyorsun?', minLength: 1, maxLength: 2000 })
  @IsString()
  @Length(1, 2000)
  message: string;

  @ApiPropertyOptional({ type: [ChatMessage] })
  @IsArray()
  @IsOptional()
  conversation_history?: ChatMessage[];
}
