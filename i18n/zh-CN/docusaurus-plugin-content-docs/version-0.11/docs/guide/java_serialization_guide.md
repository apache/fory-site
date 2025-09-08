---
title: Java 序列化
sidebar_position: 0
id: java_object_graph_guide
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

当只需要 Java 对象序列化时，该模式相比跨语言对象图序列化具有更优的性能。

## 快速开始

注意，Fory 实例的创建开销较大，**Fory 实例应在多次序列化间复用**，而不是每次都新建。
建议将 Fory 保存在静态全局变量、单例对象或有限数量的实例变量中。

单线程场景下 Fory 的用法：

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // 注意：Fory 实例应在多次序列化间复用
    Fory fory = Fory.builder().withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      .build();
    // 注册类型可减少类名序列化开销，但不是强制的。
    // 启用类注册后，所有自定义类型都必须注册。
    fory.register(SomeClass.class);
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

多线程场景下 Fory 的用法：

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // 注意：Fory 实例应在多次序列化间复用
    ThreadSafeFory fory = new ThreadLocalFory(classLoader -> {
      Fory f = Fory.builder().withLanguage(Language.JAVA)
        .withClassLoader(classLoader).build();
      f.register(SomeClass.class);
      return f;
    });
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

Fory 实例复用示例：

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  // 复用 fory 实例
  private static final ThreadSafeFory fory = new ThreadLocalFory(classLoader -> {
    Fory f = Fory.builder().withLanguage(Language.JAVA)
      .withClassLoader(classLoader).build();
    f.register(SomeClass.class);
    return f;
  });

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

## ForyBuilder 配置选项

| 选项名                              | 说明                                                                                                                                                                                                                                                                                                                                             | 默认值                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `timeRefIgnored`                    | 是否忽略所有在 `TimeSerializers` 注册的时间类型及其子类的引用跟踪（当引用跟踪开启时）。如需对时间类型启用引用跟踪，可通过 `Fory#registerSerializer(Class, Serializer)` 注册。例如：`fory.registerSerializer(Date.class, new DateSerializer(fory, true))`。注意，启用引用跟踪需在包含时间字段的类型代码生成前完成，否则这些字段仍会跳过引用跟踪。 | `true`                                                       |
| `compressInt`                       | 是否启用 int 压缩以减小序列化体积。                                                                                                                                                                                                                                                                                                              | `true`                                                       |
| `compressLong`                      | 是否启用 long 压缩以减小序列化体积。                                                                                                                                                                                                                                                                                                             | `true`                                                       |
| `compressString`                    | 是否启用字符串压缩以减小序列化体积。                                                                                                                                                                                                                                                                                                             | `false`                                                      |
| `classLoader`                       | 类加载器不建议动态变更，Fory 会缓存类元数据。如需变更类加载器，请使用 `LoaderBinding` 或 `ThreadSafeFory`。                                                                                                                                                                                                                                      | `Thread.currentThread().getContextClassLoader()`             |
| `compatibleMode`                    | 类型前向/后向兼容性配置。与 `checkClassVersion` 配置相关。`SCHEMA_CONSISTENT`：序列化端与反序列化端类结构需一致。`COMPATIBLE`：序列化端与反序列化端类结构可不同，可独立增删字段。[详见](#类结构不一致与版本校验)。                                                                                                          | `CompatibleMode.SCHEMA_CONSISTENT`                           |
| `checkClassVersion`                 | 是否校验类结构一致性。启用后，Fory 会写入并校验 `classVersionHash`。若启用 `CompatibleMode#COMPATIBLE`，此项会自动关闭。除非能确保类不会演化，否则不建议关闭。                                                                                                                                                                                   | `false`                                                      |
| `checkJdkClassSerializable`         | 是否校验 `java.*` 下的类实现了 `Serializable` 接口。若未实现，Fory 会抛出 `UnsupportedOperationException`。                                                                                                                                                                                                                                      | `true`                                                       |
| `registerGuavaTypes`                | 是否预注册 Guava 类型（如 `RegularImmutableMap`/`RegularImmutableList`）。这些类型虽非公开 API，但较为稳定。                                                                                                                                                                                                                                     | `true`                                                       |
| `requireClassRegistration`          | 关闭后可反序列化未知类型，灵活性更高，但存在安全风险。                                                                                                                                                                                                                                                                                           | `true`                                                       |
| `suppressClassRegistrationWarnings` | 是否屏蔽类注册警告。警告可用于安全审计，但可能影响体验，默认开启屏蔽。                                                                                                                                                                                                                                                                           | `true`                                                       |
| `metaShareEnabled`                  | 是否启用元数据共享模式。                                                                                                                                                                                                                                                                                                                         | `true`（若设置了 `CompatibleMode.Compatible`，否则为 false） |
| `scopedMetaShareEnabled`            | 是否启用单次序列化范围内的元数据独享。该元数据仅在本次序列化中有效，不与其他序列化共享。                                                                                                                                                                                                                                                         | `true`（若设置了 `CompatibleMode.Compatible`，否则为 false） |
| `metaCompressor`                    | 设置元数据压缩器。默认使用基于 `Deflater` 的 `DeflaterMetaCompressor`，可自定义如 `zstd` 等更高压缩比的压缩器。需保证线程安全。                                                                                                                                                                                                                  | `DeflaterMetaCompressor`                                     |
| `deserializeNonexistentClass`       | 是否允许反序列化/跳过不存在的类的数据。                                                                                                                                                                                                                                                                                                          | `true`（若设置了 `CompatibleMode.Compatible`，否则为 false） |
| `codeGenEnabled`                    | 是否启用代码生成。关闭后首次序列化更快，但后续序列化性能较低。                                                                                                                                                                                                                                                                                   | `true`                                                       |
| `asyncCompilationEnabled`           | 是否启用异步编译。启用后，序列化先用解释模式，JIT 完成后切换为 JIT 模式。                                                                                                                                                                                                                                                                        | `false`                                                      |
| `scalaOptimizationEnabled`          | 是否启用 Scala 特定优化。                                                                                                                                                                                                                                                                                                                        | `false`                                                      |
| `copyRef`                           | 关闭后，深拷贝性能更好，但会忽略循环和共享引用。对象图中的同一引用会被拷贝为不同对象。                                                                                                                                                                                                                                                           | `true`                                                       |
| `serializeEnumByName`               | 启用后，枚举按名称序列化，否则按 ordinal。                                                                                                                                                                                                                                                                                                       | `false`                                                      |

## 高级用法

### Apache Fory™ 创建

单线程 Fory 示例：

```java
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  // 启用共享/循环引用跟踪。若无重复引用可关闭以提升性能。
  .withRefTracking(false)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // 启用类型前向/后向兼容
  // 若追求更小体积和更高性能可关闭
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // 启用异步多线程编译
  .withAsyncCompilation(true)
  .build();
byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

线程安全 Fory 示例：

```java
ThreadSafeFory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  // 启用共享/循环引用跟踪。若无重复引用可关闭以提升性能。
  .withRefTracking(false)
  // 启用 int 压缩
  // .withIntCompressed(true)
  // 启用 long 压缩
  // .withLongCompressed(true)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // 启用类型前向/后向兼容
  // 若追求更小体积和更高性能可关闭
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // 启用异步多线程编译
  .withAsyncCompilation(true)
  .buildThreadSafeFory();
byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

### 序列化中的类结构演化

在实际系统中，序列化用到的类结构可能会随时间变化，比如字段的增删。当序列化和反序列化端使用不同版本的 jar 时，类结构可能不一致。

Fory 默认采用 `CompatibleMode.SCHEMA_CONSISTENT`，即要求序列化和反序列化端类结构一致，以获得最小的序列化体积和最高性能。如果结构不一致，反序列化会失败。

如需支持类结构演化（前向/后向兼容），需将 Fory 配置为 `CompatibleMode.COMPATIBLE`，允许字段增删，反序列化端可自动适配不同结构。

示例：

```java
Fory fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .build();

byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

兼容模式下，类元数据会写入序列化结果。Fory 采用高效压缩算法降低元数据开销，但仍会有一定体积增加。为进一步降低元数据成本，Fory 支持元数据共享机制，详情见[Meta Sharing](https://fory.apache.org/docs/specification/fory_java_serialization_spec#meta-share)。

### 压缩

`ForyBuilder#withIntCompressed`/`ForyBuilder#withLongCompressed` 可用于压缩 int/long 类型以减小体积。默认均为开启。

如果序列化体积不敏感（如之前用 flatbuffers 等无压缩格式），建议关闭压缩以提升性能。对于全为数字的数据，压缩可能带来 80% 的性能损失。

int 压缩采用 1~5 字节变长编码，long 压缩支持两种方式：

- SLI（Small long as int，默认）：long 在 `[-1073741824, 1073741823]` 范围内用 4 字节编码，否则用 9 字节。
- PVL（Progressive Variable-length Long）：采用变长编码，负数通过 `(v << 1) ^ (v >> 63)` 转换。

如 long 类型数据无法有效压缩，建议关闭 long 压缩以提升性能。

### 对象深拷贝

深拷贝示例：

```java
Fory fory = Fory.builder().withRefCopy(true).build();
SomeClass a = xxx;
SomeClass copied = fory.copy(a);
```

如需忽略循环和共享引用（即对象图中同一引用会被拷贝为不同对象），可关闭 refCopy：

```java
Fory fory = Fory.builder().withRefCopy(false).build();
SomeClass a = xxx;
SomeClass copied = fory.copy(a);
```

### 自定义序列化器

某些场景下需为特定类型实现自定义序列化器，尤其是 JDK `writeObject/writeReplace/readObject/readResolve` 方式效率较低时。如下例，避免 `Foo#writeObject` 被调用：

```java
class Foo {
  public long f1;

  private void writeObject(ObjectOutputStream s) throws IOException {
    System.out.println(f1);
    s.defaultWriteObject();
  }
}

class FooSerializer extends Serializer<Foo> {
  public FooSerializer(Fory fory) {
    super(fory, Foo.class);
  }

  @Override
  public void write(MemoryBuffer buffer, Foo value) {
    buffer.writeInt64(value.f1);
  }

  @Override
  public Foo read(MemoryBuffer buffer) {
    Foo foo = new Foo();
    foo.f1 = buffer.readInt64();
    return foo;
  }
}
```

注册自定义序列化器：

```java
Fory fory = getFory();
fory.registerSerializer(Foo.class, new FooSerializer(fory));
```

### 实现集合类序列化器

与 Map 类似，实现自定义 Collection 类型的序列化器时，需继承 `CollectionSerializer` 或 `AbstractCollectionSerializer`。二者区别在于，`AbstractCollectionSerializer` 可用于序列化类似集合结构但不是 Java Collection 子类的类型。

对于集合序列化器，有一个特殊参数 `supportCodegenHook` 需要配置：

- 设为 `true` 时：
  - 启用集合元素的高效访问和 JIT 编译，提升性能
  - 直接序列化调用，内联 map 的 key-value，无动态分发开销
  - 推荐用于标准集合类型
- 设为 `false` 时：
  - 采用接口方式访问元素，动态分发，灵活性更高
  - 适合有特殊序列化需求的自定义集合
  - 可处理复杂集合实现

#### 支持 JIT 的集合序列化器实现

实现支持 JIT 的集合序列化器时，可利用 Fory 现有的二进制格式和集合序列化基础设施。关键在于正确实现 `onCollectionWrite` 和 `newCollection` 方法以处理元数据，其余元素序列化由 Fory 自动完成。

示例：

```java
public class CustomCollectionSerializer<T extends Collection> extends CollectionSerializer<T> {
    public CustomCollectionSerializer(Fory fory, Class<T> cls) {
        // supportCodegenHook 控制是否启用 JIT 编译
        super(fory, cls, true);
    }

    @Override
    public Collection onCollectionWrite(MemoryBuffer buffer, T value) {
        // 写入集合大小
        buffer.writeVarUint32Small7(value.size());
        // 可写入额外集合元数据
        return value;
    }

    @Override
    public Collection newCollection(MemoryBuffer buffer) {
        // 创建新集合实例
        Collection collection = super.newCollection(buffer);
        // 读取并设置集合大小
        int numElements = getAndClearNumElements();
        setNumElements(numElements);
        return collection;
    }
}
```

> 注意：实现 `newCollection` 时需调用 `setNumElements`，以告知 Fory 反序列化多少元素。

#### 不支持 JIT 的自定义集合序列化器

有时需序列化底层为原始数组或有特殊需求的集合类型，此时可禁用 JIT，直接重写 `write` 和 `read` 方法。

这种方式：

- 完全控制序列化格式
- 适合原始数组
- 跳过集合迭代开销
- 可直接内存访问

示例（原始 int 数组）：

```java
class IntList extends AbstractCollection<Integer> {
    private final int[] elements;
    private final int size;

    public IntList(int size) {
        this.elements = new int[size];
        this.size = size;
    }

    public IntList(int[] elements, int size) {
        this.elements = elements;
        this.size = size;
    }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<Integer>() {
            private int index = 0;
            @Override
            public boolean hasNext() { return index < size; }
            @Override
            public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                return elements[index++];
            }
        };
    }

    @Override
    public int size() { return size; }

    public int get(int index) {
        if (index >= size) throw new IndexOutOfBoundsException();
        return elements[index];
    }

    public void set(int index, int value) {
        if (index >= size) throw new IndexOutOfBoundsException();
        elements[index] = value;
    }

    public int[] getElements() { return elements; }
}

class IntListSerializer extends AbstractCollectionSerializer<IntList> {
    public IntListSerializer(Fory fory) {
        // 禁用 JIT，完全自定义序列化
        super(fory, IntList.class, false);
    }

    @Override
    public void write(MemoryBuffer buffer, IntList value) {
        buffer.writeVarUint32Small7(value.size());
        int[] elements = value.getElements();
        for (int i = 0; i < value.size(); i++) {
            buffer.writeVarInt32(elements[i]);
        }
    }

    @Override
    public IntList read(MemoryBuffer buffer) {
        int size = buffer.readVarUint32Small7();
        int[] elements = new int[size];
        for (int i = 0; i < size; i++) {
            elements[i] = buffer.readVarInt32();
        }
        return new IntList(elements, size);
    }

    // JIT 禁用时以下方法不使用
    @Override public Collection onCollectionWrite(MemoryBuffer buffer, IntList value) { throw new UnsupportedOperationException(); }
    @Override public Collection newCollection(MemoryBuffer buffer) { throw new UnsupportedOperationException(); }
    @Override public IntList onCollectionRead(Collection collection) { throw new UnsupportedOperationException(); }
}
```

**关键点说明：**

1. **原始数组存储**：直接用 int[]，避免装箱/拆箱，内存布局高效。
2. **直接序列化**：先写 size，再写原始值，无需迭代，无装箱/拆箱。
3. **直接反序列化**：先读 size，再读原始值填充数组，最后构造对象。
4. **禁用 JIT**：`supportCodegenHook=false`，重写 `write/read`，完全自定义格式。

**适用场景：**

- 只处理原始类型
- 性能极致要求
- 需最小内存开销
- 有特殊序列化需求

**使用示例：**

```java
IntList list = new IntList(3);
list.set(0, 1); list.set(1, 2); list.set(2, 3);
byte[] bytes = fory.serialize(list);
IntList newList = (IntList) fory.deserialize(bytes);
```

> 虽然放弃了 Fory 的部分优化，但对原始类型和直接数组访问场景性能极高。

#### 实现 collection-like 类型序列化器

有时需为类似集合但非标准 Java Collection 的类型实现序列化器。原则如下：

1. 继承 `AbstractCollectionSerializer`
2. 启用 JIT 优化（`supportCodegenHook=true`）
3. 通过视图类高效访问元素
4. 正确管理 size

示例：

```java
class CustomCollectionLike {
    private final Object[] elements;
    private final int size;
    public CustomCollectionLike(int size) { this.elements = new Object[size]; this.size = size; }
    public CustomCollectionLike(Object[] elements, int size) { this.elements = elements; this.size = size; }
    public Object get(int index) { if (index >= size) throw new IndexOutOfBoundsException(); return elements[index]; }
    public int size() { return size; }
    public Object[] getElements() { return elements; }
}

class CollectionView extends AbstractCollection<Object> {
    private final Object[] elements;
    private final int size;
    private int writeIndex;
    public CollectionView(CustomCollectionLike collection) { this.elements = collection.getElements(); this.size = collection.size(); }
    public CollectionView(int size) { this.size = size; this.elements = new Object[size]; }
    @Override public Iterator<Object> iterator() { return new Iterator<Object>() { private int index = 0; @Override public boolean hasNext() { return index < size; } @Override public Object next() { if (!hasNext()) throw new NoSuchElementException(); return elements[index++]; } }; }
    @Override public boolean add(Object element) { if (writeIndex >= size) throw new IllegalStateException("Collection is full"); elements[writeIndex++] = element; return true; }
    @Override public int size() { return size; }
    public Object[] getElements() { return elements; }
}

class CustomCollectionSerializer extends AbstractCollectionSerializer<CustomCollectionLike> {
    public CustomCollectionSerializer(Fory fory) { super(fory, CustomCollectionLike.class, true); }
    @Override public Collection onCollectionWrite(MemoryBuffer buffer, CustomCollectionLike value) { buffer.writeVarUint32Small7(value.size()); return new CollectionView(value); }
    @Override public Collection newCollection(MemoryBuffer buffer) { int numElements = buffer.readVarUint32Small7(); setNumElements(numElements); return new CollectionView(numElements); }
    @Override public CustomCollectionLike onCollectionRead(Collection collection) { CollectionView view = (CollectionView) collection; return new CustomCollectionLike(view.getElements(), view.size()); }
}
```

**关键点说明：**

- 数组存储，定长，直接访问
- 视图类继承 `AbstractCollection`，实现迭代和 add
- 支持 JIT 优化，数组零拷贝
- 性能优先，灵活性略低

---

如需继续补充 map-like 类型、注册自定义序列化器、Externalizable 支持等内容，请回复"继续"！

### 自定义 Map 序列化器

自定义 Map 类型序列化器需继承 `MapSerializer` 或 `AbstractMapSerializer`。二者区别类似集合序列化器。

- `supportCodegenHook=true`：推荐用于标准 Map，支持 JIT 优化
- `supportCodegenHook=false`：适合特殊需求，需手动实现序列化逻辑

#### 支持 JIT 的 Map 序列化器示例

```java
public class CustomMapSerializer<T extends Map> extends MapSerializer<T> {
    public CustomMapSerializer(Fory fory, Class<T> cls) {
        super(fory, cls, true);
    }

    @Override
    public Map onMapWrite(MemoryBuffer buffer, T value) {
        buffer.writeVarUint32Small7(value.size());
        return value;
    }

    @Override
    public Map newMap(MemoryBuffer buffer) {
        int numElements = buffer.readVarUint32Small7();
        setNumElements(numElements);
        return new HashMap(numElements);
    }
}
```

#### 不支持 JIT 的自定义 Map 序列化器

适用于有特殊字段或自定义二进制格式的 Map 类型。

```java
class FixedValueMap extends AbstractMap<String, Integer> {
    // ... 省略实现 ...
}

class FixedValueMapSerializer extends AbstractMapSerializer<FixedValueMap> {
    public FixedValueMapSerializer(Fory fory) {
        super(fory, FixedValueMap.class, false);
    }

    @Override
    public void write(MemoryBuffer buffer, FixedValueMap value) {
        buffer.writeInt32(value.getFixedValue());
        buffer.writeVarUint32Small7(value.getKeys().size());
        for (String key : value.getKeys()) {
            buffer.writeString(key);
        }
    }

    @Override
    public FixedValueMap read(MemoryBuffer buffer) {
        int fixedValue = buffer.readInt32();
        int size = buffer.readVarUint32Small7();
        Set<String> keys = new HashSet<>(size);
        for (int i = 0; i < size; i++) {
            keys.add(buffer.readString());
        }
        return new FixedValueMap(keys, fixedValue);
    }

    @Override
    public Map onMapWrite(MemoryBuffer buffer, FixedValueMap value) {
        throw new UnsupportedOperationException();
    }

    @Override
    public FixedValueMap onMapRead(Map map) {
        throw new UnsupportedOperationException();
    }

    @Override
    public FixedValueMap onMapCopy(Map map) {
        throw new UnsupportedOperationException();
    }
}
```

### 注册自定义序列化器

实现自定义序列化器后，需通过如下方式注册：

```java
Fory fory = Fory.builder()
    .withLanguage(Language.JAVA)
    .build();

// 注册 Map 序列化器
fory.registerSerializer(CustomMap.class, new CustomMapSerializer<>(fory, CustomMap.class));

// 注册集合序列化器
fory.registerSerializer(CustomCollection.class, new CustomCollectionSerializer<>(fory, CustomCollection.class));
```

> 注意事项：
>
> 1. 始终继承合适的基类（Map 用 `MapSerializer`/`AbstractMapSerializer`，集合用 `CollectionSerializer`/`AbstractCollectionSerializer`）
> 2. 根据 `supportCodegenHook` 选择性能与灵活性
> 3. 如需引用跟踪，需正确处理
> 4. `supportCodegenHook=true` 时，需用 `setNumElements`/`getAndClearNumElements` 管理元素数量

### 安全与类注册

`ForyBuilder#requireClassRegistration` 可关闭类注册校验，允许反序列化未知类型，灵活但有安全风险。

**如无法确保环境安全，切勿关闭类注册。**  
反序列化未知/不受信任类型时，恶意代码可能在 `init/equals/hashCode` 等方法中被执行。

类注册不仅提升安全性，还可减少类名序列化开销。注册顺序需保持序列化端与反序列化端一致。

```java
Fory fory = xxx;
fory.register(SomeClass.class);
fory.register(SomeClass1.class, 200);
```

如需关闭注册校验，可通过 `ClassResolver#setClassChecker` 自定义允许的类名：

```java
Fory fory = xxx;
fory.getClassResolver().setClassChecker(
  (classResolver, className) -> className.startsWith("org.example."));
```

或使用 `AllowListChecker`：

```java
AllowListChecker checker = new AllowListChecker(AllowListChecker.CheckLevel.STRICT);
ThreadSafeFory fory = new ThreadLocalFory(classLoader -> {
  Fory f = Fory.builder().requireClassRegistration(true).withClassLoader(classLoader).build();
  f.getClassResolver().setClassChecker(checker);
  checker.addListener(f.getClassResolver());
  return f;
});
checker.allowClass("org.example.*");
```

Fory 提供了 `org.apache.fory.resolver.AllowListChecker`，也可自行实现更复杂的校验逻辑。

### 按名称注册类

按 id 注册类性能和体积更优，但如需管理大量类型 id，可用 `register(Class<?> cls, String namespace, String typeName)` 按名称注册：

```java
fory.register(Foo.class, "demo", "Foo");
```

如无重名，`namespace` 可为空以减少体积。

**不建议用名称注册，因序列化体积会显著增加。**

### 零拷贝序列化

Fory 支持零拷贝序列化，可高效处理大对象或直接内存缓冲区。示例：

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
import org.apache.fory.serializer.BufferObject;
import org.apache.fory.memory.MemoryBuffer;

import java.util.*;
import java.util.stream.Collectors;

public class ZeroCopyExample {
  // 注意：Fory 实例应复用，不要每次新建
  static Fory fory = Fory.builder()
    .withLanguage(Language.JAVA)
    .build();

  // mvn exec:java -Dexec.mainClass="io.ray.fory.examples.ZeroCopyExample"
  public static void main(String[] args) {
    List<Object> list = Arrays.asList("str", new byte[1000], new int[100], new double[100]);
    Collection<BufferObject> bufferObjects = new ArrayList<>();
    byte[] bytes = fory.serialize(list, e -> !bufferObjects.add(e));
    List<MemoryBuffer> buffers = bufferObjects.stream()
      .map(BufferObject::toBuffer).collect(Collectors.toList());
    System.out.println(fory.deserialize(bytes, buffers));
  }
}
```

### 元数据共享（Meta Sharing）

Fory 支持在同一上下文（如 TCP 连接）内共享类型元数据（类名、字段名、最终字段类型等）。首次序列化时元数据会发送到对端，对端可基于元数据重建反序列化器，后续序列化无需重复传输元数据，从而减少网络流量并自动支持类型前向/后向兼容。

```java
// Fory.builder()
//   .withLanguage(Language.JAVA)
//   .withRefTracking(false)
//   // 跨序列化共享元数据
//   .withMetaContextShare(true)
// 非线程安全 Fory
MetaContext context = xxx;
fory.getSerializationContext().setMetaContext(context);
byte[] bytes = fory.serialize(o);
// 非线程安全 Fory
MetaContext context = xxx;
fory.getSerializationContext().setMetaContext(context);
fory.deserialize(bytes);

// 线程安全 Fory
fory.setClassLoader(beanA.getClass().getClassLoader());
byte[] serialized = fory.execute(
  f -> {
    f.getSerializationContext().setMetaContext(context);
    return f.serialize(beanA);
  }
);
// 线程安全 Fory
fory.setClassLoader(beanA.getClass().getClassLoader());
Object newObj = fory.execute(
  f -> {
    f.getSerializationContext().setMetaContext(context);
    return f.deserialize(serialized);
  }
);
```

### 反序列化不存在的类

Fory 支持反序列化不存在的类。通过 `ForyBuilder#deserializeNonexistentClass(true)` 启用。当启用且元数据共享开启时，Fory 会将该类型的数据存储为 Map 的惰性子类，避免反序列化时填充 Map 的重排开销，提升性能。如果数据被发送到另一个进程且该类存在，则可无损还原为原类型对象。

若未启用元数据共享，则新类数据会被跳过，返回 `NonexistentSkipClass` 占位对象。

### 类型映射（跨类型深拷贝/映射）

Fory 支持将一个类型的对象深拷贝/映射为另一个类型。注意事项：

1. 该映射会执行深拷贝，所有映射字段会先序列化为二进制，再反序列化为目标类型。
2. 所有结构体类型必须用相同 ID 注册，否则无法正确映射。务必保证序列化和反序列化端注册顺序一致。

示例：

```java
public class StructMappingExample {
  static class Struct1 {
    int f1;
    String f2;

    public Struct1(int f1, String f2) {
      this.f1 = f1;
      this.f2 = f2;
    }
  }

  static class Struct2 {
    int f1;
    String f2;
    double f3;
  }

  static ThreadSafeFory fory1 = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();
  static ThreadSafeFory fory2 = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();

  static {
    fory1.register(Struct1.class);
    fory2.register(Struct2.class);
  }

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    Struct2 struct2 = (Struct2) fory2.deserialize(fory1.serialize(struct1));
    Assert.assertEquals(struct2.f1, struct1.f1);
    Assert.assertEquals(struct2.f2, struct1.f2);
    struct1 = (Struct1) fory1.deserialize(fory2.serialize(struct2));
    Assert.assertEquals(struct1.f1, struct2.f1);
    Assert.assertEquals(struct1.f2, struct2.f2);
  }
}
```

## 迁移

### JDK 序列化迁移

如果之前使用 JDK 序列化，且无法同时升级客户端和服务端（如线上应用常见场景），Fory 提供 `org.apache.fory.serializer.JavaSerializer.serializedByJDK` 工具方法判断二进制数据是否为 JDK 序列化生成。可用如下模式实现协议兼容，支持异步滚动升级：

```java
if (JavaSerializer.serializedByJDK(bytes)) {
  ObjectInputStream objectInputStream=xxx;
  return objectInputStream.readObject();
} else {
  return fory.deserialize(bytes);
}
```

### Apache Fory™ 版本升级

目前仅保证小版本间的二进制兼容性。例如，fory `v0.11.1` 升级到 `v0.11.2` 可直接兼容，升级到 `v0.12.0` 则不保证兼容。大多数场景无需频繁升级主版本，当前版本已足够高效紧凑，老版本也会持续维护 bugfix。

## 故障排查

### 类结构不一致与版本校验

若未设置 `CompatibleMode` 为 `org.apache.fory.config.CompatibleMode.COMPATIBLE`，出现序列化异常，可能是序列化端和反序列化端类结构不一致。

此时可用 `ForyBuilder#withClassVersionCheck` 创建 Fory 进行校验，若反序列化抛出 `org.apache.fory.exception.ClassNotCompatibleException`，说明类结构不一致，应改用 `ForyBuilder#withCompaibleMode(CompatibleMode.COMPATIBLE)`。

`CompatibleMode.COMPATIBLE` 会带来一定性能和体积开销，若类结构始终一致，不建议默认开启。

### POJO 跨类型反序列化

Fory 支持将一个 POJO 序列化后反序列化为不同结构的 POJO。此时需将 `CompatibleMode` 设为 `org.apache.fory.config.CompatibleMode.COMPATIBLE`。

```java
public class DeserializeIntoType {
  static class Struct1 {
    int f1;
    String f2;

    public Struct1(int f1, String f2) {
      this.f1 = f1;
      this.f2 = f2;
    }
  }

  static class Struct2 {
    int f1;
    String f2;
    double f3;
  }

  static ThreadSafeFory fory = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    byte[] data = fory.serializeJavaObject(struct1);
    Struct2 struct2 = (Struct2) fory.deserializeJavaObject(bytes, Struct2.class);
  }
}
```

### 反序列化 API 使用错误

- 用 `Fory#serialize` 序列化的对象，需用 `Fory#deserialize` 反序列化，不能用 `Fory#deserializeJavaObject`。
- 用 `Fory#serializeJavaObject` 序列化的对象，需用 `Fory#deserializeJavaObject` 反序列化，不能用 `Fory#deserializeJavaObjectAndClass` 或 `Fory#deserialize`。
- 用 `Fory#serializeJavaObjectAndClass` 序列化的对象，需用 `Fory#deserializeJavaObjectAndClass` 反序列化，不能用其他 API。
