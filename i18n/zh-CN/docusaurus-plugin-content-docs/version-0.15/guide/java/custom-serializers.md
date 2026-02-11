---
title: 自定义序列化器
sidebar_position: 4
id: custom_serializers
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

本页介绍如何为你的类型实现自定义序列化器。

## 基本自定义序列化器

在某些情况下，你可能想为你的类型实现序列化器，特别是对于使用 JDK `writeObject/writeReplace/readObject/readResolve` 自定义序列化的类，这非常低效。

例如，如果你不想调用以下 `Foo#writeObject`，你可以实现自定义序列化器：

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

### 注册序列化器

```java
Fory fory = getFory();
fory.registerSerializer(Foo.class, new FooSerializer(fory));
```

除了注册序列化器，你还可以为类实现 `java.io.Externalizable` 来自定义序列化逻辑。这种类型将由 Fory 的 `ExternalizableSerializer` 序列化。

## 集合序列化器

在为自定义集合类型实现序列化器时，你必须扩展 `CollectionSerializer` 或 `CollectionLikeSerializer`。主要区别是 `CollectionLikeSerializer` 可以序列化具有类似集合结构但不是 Java Collection 子类型的类。

### supportCodegenHook 参数

这个特殊参数控制序列化行为：

**当为 `true` 时：**

- 启用对集合元素的优化访问和 JIT 编译以获得更好的性能
- 直接序列化调用和内联集合项，无需动态序列化器分派成本
- 对标准集合类型有更好的性能
- 对大多数集合推荐

**当为 `false` 时：**

- 使用基于接口的元素访问和元素的动态序列化器分派（成本更高）
- 对自定义集合类型更灵活
- 当集合有特殊序列化需求时需要
- 处理复杂的集合实现

### 带 JIT 支持的集合序列化器

在实现带 JIT 支持的集合序列化器时，利用 Fory 现有的二进制格式和集合序列化基础设施：

```java
public class CustomCollectionSerializer<T extends Collection> extends CollectionSerializer<T> {
    public CustomCollectionSerializer(Fory fory, Class<T> cls) {
        // supportCodegenHook 控制是否使用 JIT 编译
        super(fory, cls, true);
    }

    @Override
    public Collection onCollectionWrite(MemoryBuffer buffer, T value) {
        // 写入集合大小
        buffer.writeVarUint32Small7(value.size());
        // 写入任何额外的集合元数据
        return value;
    }

    @Override
    public Collection newCollection(MemoryBuffer buffer) {
        // 创建新的集合实例
        Collection collection = super.newCollection(buffer);
        // 读取并设置集合大小
        int numElements = getAndClearNumElements();
        setNumElements(numElements);
        return collection;
    }
}
```

注意：在实现 `newCollection` 时调用 `setNumElements`，让 Fory 知道要反序列化多少元素。

### 不带 JIT 的自定义集合序列化器

对于使用原始数组或有特殊要求的集合，实现禁用 JIT 的序列化器：

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
            public boolean hasNext() {
                return index < size;
            }

            @Override
            public Integer next() {
                if (!hasNext()) {
                    throw new NoSuchElementException();
                }
                return elements[index++];
            }
        };
    }

    @Override
    public int size() {
        return size;
    }

    public int get(int index) {
        if (index >= size) {
            throw new IndexOutOfBoundsException();
        }
        return elements[index];
    }

    public void set(int index, int value) {
        if (index >= size) {
            throw new IndexOutOfBoundsException();
        }
        elements[index] = value;
    }

    public int[] getElements() {
        return elements;
    }
}

class IntListSerializer extends CollectionLikeSerializer<IntList> {
    public IntListSerializer(Fory fory) {
        // 禁用 JIT，因为我们直接处理序列化
        super(fory, IntList.class, false);
    }

    @Override
    public void write(MemoryBuffer buffer, IntList value) {
        // 写入大小
        buffer.writeVarUint32Small7(value.size());

        // 直接将元素写为原始 int
        int[] elements = value.getElements();
        for (int i = 0; i < value.size(); i++) {
            buffer.writeVarInt32(elements[i]);
        }
    }

    @Override
    public IntList read(MemoryBuffer buffer) {
        // 读取大小
        int size = buffer.readVarUint32Small7();

        // 创建数组并读取元素
        int[] elements = new int[size];
        for (int i = 0; i < size; i++) {
            elements[i] = buffer.readVarInt32();
        }

        return new IntList(elements, size);
    }

    // 当禁用 JIT 时不使用这些方法
    @Override
    public Collection onCollectionWrite(MemoryBuffer buffer, IntList value) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Collection newCollection(MemoryBuffer buffer) {
        throw new UnsupportedOperationException();
    }

    @Override
    public IntList onCollectionRead(Collection collection) {
        throw new UnsupportedOperationException();
    }
}
```

**何时使用此方法：**

- 处理原始类型
- 需要最大性能
- 想要最小化内存开销
- 有特殊的序列化需求

### 类集合类型序列化器

对于行为类似集合但不是标准 Java 集合的类型：

```java
class CustomCollectionLike {
    private final Object[] elements;
    private final int size;

    public CustomCollectionLike(int size) {
        this.elements = new Object[size];
        this.size = 0;
    }

    public CustomCollectionLike(Object[] elements, int size) {
        this.elements = elements;
        this.size = size;
    }

    public Object get(int index) {
        if (index >= size) {
            throw new IndexOutOfBoundsException();
        }
        return elements[index];
    }

    public int size() {
        return size;
    }

    public Object[] getElements() {
        return elements;
    }
}

class CollectionView extends AbstractCollection<Object> {
    private final Object[] elements;
    private final int size;
    private int writeIndex;

    public CollectionView(CustomCollectionLike collection) {
        this.elements = collection.getElements();
        this.size = collection.size();
    }

    public CollectionView(int size) {
        this.size = size;
        this.elements = new Object[size];
    }

    @Override
    public Iterator<Object> iterator() {
        return new Iterator<Object>() {
            private int index = 0;

            @Override
            public boolean hasNext() {
                return index < size;
            }

            @Override
            public Object next() {
                if (!hasNext()) {
                    throw new NoSuchElementException();
                }
                return elements[index++];
            }
        };
    }

    @Override
    public boolean add(Object element) {
        if (writeIndex >= size) {
            throw new IllegalStateException("Collection is full");
        }
        elements[writeIndex++] = element;
        return true;
    }

    @Override
    public int size() {
        return size;
    }

    public Object[] getElements() {
        return elements;
    }
}

class CustomCollectionSerializer extends CollectionLikeSerializer<CustomCollectionLike> {
    public CustomCollectionSerializer(Fory fory) {
        super(fory, CustomCollectionLike.class, true);
    }

    @Override
    public Collection onCollectionWrite(MemoryBuffer buffer, CustomCollectionLike value) {
        buffer.writeVarUint32Small7(value.size());
        return new CollectionView(value);
    }

    @Override
    public Collection newCollection(MemoryBuffer buffer) {
        int numElements = buffer.readVarUint32Small7();
        setNumElements(numElements);
        return new CollectionView(numElements);
    }

    @Override
    public CustomCollectionLike onCollectionRead(Collection collection) {
        CollectionView view = (CollectionView) collection;
        return new CustomCollectionLike(view.getElements(), view.size());
    }
}
```

## Map 序列化器

在为自定义 Map 类型实现序列化器时，扩展 `MapSerializer` 或 `MapLikeSerializer`。主要区别是 `MapLikeSerializer` 可以序列化具有类似 map 结构但不是 Java Map 子类型的类。

### 带 JIT 支持的 Map 序列化器

```java
public class CustomMapSerializer<T extends Map> extends MapSerializer<T> {
    public CustomMapSerializer(Fory fory, Class<T> cls) {
        // supportCodegenHook 是决定序列化行为的关键参数
        super(fory, cls, true);
    }

    @Override
    public Map onMapWrite(MemoryBuffer buffer, T value) {
        // 写入 map 大小
        buffer.writeVarUint32Small7(value.size());
        // 在这里写入任何额外的 map 元数据
        return value;
    }

    @Override
    public Map newMap(MemoryBuffer buffer) {
        // 读取 map 大小
        int numElements = buffer.readVarUint32Small7();
        setNumElements(numElements);
        // 创建并返回新的 map 实例
        T map = (T) new HashMap(numElements);
        fory.getRefResolver().reference(map);
        return map;
    }
}
```

注意：在实现 `newMap` 时调用 `setNumElements`，让 Fory 知道要反序列化多少元素。

### 不带 JIT 的自定义 Map 序列化器

对于完全控制序列化过程：

```java
class FixedValueMap extends AbstractMap<String, Integer> {
    private final Set<String> keys;
    private final int fixedValue;

    public FixedValueMap(Set<String> keys, int fixedValue) {
        this.keys = keys;
        this.fixedValue = fixedValue;
    }

    @Override
    public Set<Entry<String, Integer>> entrySet() {
        Set<Entry<String, Integer>> entries = new HashSet<>();
        for (String key : keys) {
            entries.add(new SimpleEntry<>(key, fixedValue));
        }
        return entries;
    }

    @Override
    public Integer get(Object key) {
        return keys.contains(key) ? fixedValue : null;
    }

    public Set<String> getKeys() {
        return keys;
    }

    public int getFixedValue() {
        return fixedValue;
    }
}

class FixedValueMapSerializer extends MapLikeSerializer<FixedValueMap> {
    public FixedValueMapSerializer(Fory fory) {
        // 禁用 codegen，因为我们直接处理序列化
        super(fory, FixedValueMap.class, false);
    }

    @Override
    public void write(MemoryBuffer buffer, FixedValueMap value) {
        // 写入固定值
        buffer.writeInt32(value.getFixedValue());
        // 写入键的数量
        buffer.writeVarUint32Small7(value.getKeys().size());
        // 写入每个键
        for (String key : value.getKeys()) {
            buffer.writeString(key);
        }
    }

    @Override
    public FixedValueMap read(MemoryBuffer buffer) {
        // 读取固定值
        int fixedValue = buffer.readInt32();
        // 读取键的数量
        int size = buffer.readVarUint32Small7();
        Set<String> keys = new HashSet<>(size);
        for (int i = 0; i < size; i++) {
            keys.add(buffer.readString());
        }
        return new FixedValueMap(keys, fixedValue);
    }

    // 当 supportCodegenHook 为 false 时不使用这些方法
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

### 类 Map 类型序列化器

对于行为类似 map 但不是标准 Java Map 的类型：

```java
class CustomMapLike {
    private final Object[] keyArray;
    private final Object[] valueArray;
    private final int size;

    public CustomMapLike(int initialCapacity) {
        this.keyArray = new Object[initialCapacity];
        this.valueArray = new Object[initialCapacity];
        this.size = 0;
    }

    public CustomMapLike(Object[] keyArray, Object[] valueArray, int size) {
        this.keyArray = keyArray;
        this.valueArray = valueArray;
        this.size = size;
    }

    public Integer get(String key) {
        for (int i = 0; i < size; i++) {
            if (key.equals(keyArray[i])) {
                return (Integer) valueArray[i];
            }
        }
        return null;
    }

    public int size() {
        return size;
    }

    public Object[] getKeyArray() {
        return keyArray;
    }

    public Object[] getValueArray() {
        return valueArray;
    }
}

class MapView extends AbstractMap<Object, Object> {
    private final Object[] keyArray;
    private final Object[] valueArray;
    private final int size;
    private int writeIndex;

    public MapView(CustomMapLike mapLike) {
        this.size = mapLike.size();
        this.keyArray = mapLike.getKeyArray();
        this.valueArray = mapLike.getValueArray();
    }

    public MapView(int size) {
        this.size = size;
        this.keyArray = new Object[size];
        this.valueArray = new Object[size];
    }

    @Override
    public Set<Entry<Object, Object>> entrySet() {
        return new AbstractSet<Entry<Object, Object>>() {
            @Override
            public Iterator<Entry<Object, Object>> iterator() {
                return new Iterator<Entry<Object, Object>>() {
                    private int index = 0;

                    @Override
                    public boolean hasNext() {
                        return index < size;
                    }

                    @Override
                    public Entry<Object, Object> next() {
                        if (!hasNext()) {
                            throw new NoSuchElementException();
                        }
                        final int currentIndex = index++;
                        return new SimpleEntry<>(
                            keyArray[currentIndex],
                            valueArray[currentIndex]
                        );
                    }
                };
            }

            @Override
            public int size() {
                return size;
            }
        };
    }

    @Override
    public Object put(Object key, Object value) {
        if (writeIndex >= size) {
            throw new IllegalStateException("Map is full");
        }
        keyArray[writeIndex] = key;
        valueArray[writeIndex] = value;
        writeIndex++;
        return null;
    }

    public Object[] getKeyArray() {
        return keyArray;
    }

    public Object[] getValueArray() {
        return valueArray;
    }

    public int size() {
        return size;
    }
}

class CustomMapLikeSerializer extends MapLikeSerializer<CustomMapLike> {
    public CustomMapLikeSerializer(Fory fory) {
        super(fory, CustomMapLike.class, true);
    }

    @Override
    public Map onMapWrite(MemoryBuffer buffer, CustomMapLike value) {
        buffer.writeVarUint32Small7(value.size());
        return new MapView(value);
    }

    @Override
    public Map newMap(MemoryBuffer buffer) {
        int numElements = buffer.readVarUint32Small7();
        setNumElements(numElements);
        return new MapView(numElements);
    }

    @Override
    public CustomMapLike onMapRead(Map map) {
        MapView view = (MapView) map;
        return new CustomMapLike(view.getKeyArray(), view.getValueArray(), view.size());
    }

    @Override
    public CustomMapLike onMapCopy(Map map) {
        MapView view = (MapView) map;
        return new CustomMapLike(view.getKeyArray(), view.getValueArray(), view.size());
    }
}
```

## 注册自定义序列化器

```java
Fory fory = Fory.builder()
    .withLanguage(Language.JAVA)
    .build();

// 注册 map 序列化器
fory.registerSerializer(CustomMap.class, new CustomMapSerializer<>(fory, CustomMap.class));

// 注册集合序列化器
fory.registerSerializer(CustomCollection.class, new CustomCollectionSerializer<>(fory, CustomCollection.class));
```

## 关键点

实现自定义 map 或集合序列化器时：

1. 始终扩展适当的基类（map 使用 `MapSerializer`/`MapLikeSerializer`，集合使用 `CollectionSerializer`/`CollectionLikeSerializer`）
2. 考虑 `supportCodegenHook` 对性能和功能的影响
3. 如果需要，适当处理引用跟踪
4. 当 `supportCodegenHook` 为 `true` 时，使用 `setNumElements` 和 `getAndClearNumElements` 实现适当的大小管理

## 相关主题

- [类型注册](type-registration.md) - 注册序列化器
- [Schema 演化](schema-evolution.md) - 兼容模式考虑
- [配置选项](configuration.md) - 序列化选项
