---
title: 行存格式
sidebar_position: 1
id: row_format
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

## Java

```java
public class Bar {
  String f1;
  List<Long> f2;
}

public class Foo {
  int f1;
  List<Integer> f2;
  Map<String, Integer> f3;
  List<Bar> f4;
}

RowEncoder<Foo> encoder = Encoders.bean(Foo.class);
Foo foo = new Foo();
foo.f1 = 10;
foo.f2 = IntStream.range(0, 1000000).boxed().collect(Collectors.toList());
foo.f3 = IntStream.range(0, 1000000).boxed().collect(Collectors.toMap(i -> "k"+i, i->i));
List<Bar> bars = new ArrayList<>(1000000);
for (int i = 0; i < 1000000; i++) {
  Bar bar = new Bar();
  bar.f1 = "s"+i;
  bar.f2 = LongStream.range(0, 10).boxed().collect(Collectors.toList());
  bars.add(bar);
}
foo.f4 = bars;
// 可被 python 零拷贝读取
BinaryRow binaryRow = encoder.toRow(foo);
// 也可以是 python 生成的数据
Foo newFoo = encoder.fromRow(binaryRow);
// 零拷贝读取 List<Integer> f2
BinaryArray binaryArray2 = binaryRow.getArray(1);
// 零拷贝读取 List<Bar> f4
BinaryArray binaryArray4 = binaryRow.getArray(3);
// 零拷贝读取 `readList<Bar> f4` 的第 11 个元素
BinaryRow barStruct = binaryArray4.getStruct(10);

// 零拷贝读取 `readList<Bar> f4` 第 11 个元素的 f2 的第 6 个元素
barStruct.getArray(1).getInt64(5);
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
// 只反序列化部分数据
Bar newBar = barEncoder.fromRow(barStruct);
Bar newBar2 = barEncoder.fromRow(binaryArray4.getStruct(20));
```

## Python

```python
@dataclass
class Bar:
    f1: str
    f2: List[pa.int64]
@dataclass
class Foo:
    f1: pa.int32
    f2: List[pa.int32]
    f3: Dict[str, pa.int32]
    f4: List[Bar]

encoder = pyfory.encoder(Foo)
foo = Foo(f1=10, f2=list(range(1000_000)),
         f3={f"k{i}": i for i in range(1000_000)},
         f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1000_000)])
binary: bytes = encoder.to_row(foo).to_bytes()
print(f"start: {datetime.datetime.now()}")
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000], foo_row.f4[100000].f1, foo_row.f4[200000].f2[5])
print(f"end: {datetime.datetime.now()}")

binary = pickle.dumps(foo)
print(f"pickle start: {datetime.datetime.now()}")
new_foo = pickle.loads(binary)
print(new_foo.f2[100000], new_foo.f4[100000].f1, new_foo.f4[200000].f2[5])
print(f"pickle end: {datetime.datetime.now()}")
```

### Apache Arrow 支持

Fory Format 也支持与 Arrow Table/RecordBatch 的自动转换。

Java 示例：

```java
Schema schema = TypeInference.inferSchema(BeanA.class);
ArrowWriter arrowWriter = ArrowUtils.createArrowWriter(schema);
Encoder<BeanA> encoder = Encoders.rowEncoder(BeanA.class);
for (int i = 0; i < 10; i++) {
  BeanA beanA = BeanA.createBeanA(2);
  arrowWriter.write(encoder.toRow(beanA));
}
return arrowWriter.finishAsRecordBatch();
```

## 支持接口与继承类型

Fury 现已支持 Java `interface` 类型和子类（`extends`）类型的行格式映射，带来更动态和灵活的数据 schema。

相关增强见 [#2243](https://github.com/apache/fury/pull/2243)、[#2250](https://github.com/apache/fury/pull/2250)、[#2256](https://github.com/apache/fury/pull/2256)。

### 示例：接口类型的 RowEncoder 映射

```java
public interface Animal {
  String speak();
}

public class Dog implements Animal {
  public String name;

  @Override
  public String speak() {
    return "Woof";
  }
}

// 使用 RowEncoder 以接口类型编码和解码
RowEncoder<Animal> encoder = Encoders.bean(Animal.class);
Dog dog = new Dog();
dog.name = "Bingo";
BinaryRow row = encoder.toRow(dog);
Animal decoded = encoder.fromRow(row);
System.out.println(decoded.speak()); // Woof

```

### 示例：继承类型的 RowEncoder 映射

```java
public class Parent {
    public String parentField;
}

public class Child extends Parent {
    public String childField;
}

// 使用 RowEncoder 以父类类型编码和解码
RowEncoder<Parent> encoder = Encoders.bean(Parent.class);
Child child = new Child();
child.parentField = "Hello";
child.childField = "World";
BinaryRow row = encoder.toRow(child);
Parent decoded = encoder.fromRow(row);

```

Python 示例：

```python
import pyfory
encoder = pyfory.encoder(Foo)
encoder.to_arrow_record_batch([foo] * 10000)
encoder.to_arrow_table([foo] * 10000)
```

C++ 示例：

```c++
std::shared_ptr<ArrowWriter> arrow_writer;
EXPECT_TRUE(
    ArrowWriter::Make(schema, ::arrow::default_memory_pool(), &arrow_writer)
        .ok());
for (auto &row : rows) {
  EXPECT_TRUE(arrow_writer->Write(row).ok());
}
std::shared_ptr<::arrow::RecordBatch> record_batch;
EXPECT_TRUE(arrow_writer->Finish(&record_batch).ok());
EXPECT_TRUE(record_batch->Validate().ok());
EXPECT_EQ(record_batch->num_columns(), schema->num_fields());
EXPECT_EQ(record_batch->num_rows(), row_nums);
```

```java
Schema schema = TypeInference.inferSchema(BeanA.class);
ArrowWriter arrowWriter = ArrowUtils.createArrowWriter(schema);
Encoder<BeanA> encoder = Encoders.rowEncoder(BeanA.class);
for (int i = 0; i < 10; i++) {
  BeanA beanA = BeanA.createBeanA(2);
  arrowWriter.write(encoder.toRow(beanA));
}
return arrowWriter.finishAsRecordBatch();
```
