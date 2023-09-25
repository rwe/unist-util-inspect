/**
 * @typedef {import('nlcst').Root} NlcstRoot
 */

import assert from 'node:assert/strict'
import test from 'node:test'
/* eslint-disable-next-line unicorn/import-style */
import {Chalk} from 'chalk'
import {h} from 'hastscript'
import {retext} from 'retext'
import strip from 'strip-ansi'
import {u} from 'unist-builder'
import {inspect, inspectColor, inspectNoColor} from 'unist-util-inspect'
import {x} from 'xastscript'
import {fromXml} from 'xast-util-from-xml'

const chalkEnabled = new Chalk({level: 1})

const paragraph = 'Some simple text. Other “sentence”.'

/**
 * Split `text` on newlines, keeping the first `count`.
 *
 * @param {string} text
 * @param {number} count
 * @return string
 *   The first `count` lines of `text`.
 */
const lines = (text, count) => text.split('\n').slice(0, count).join('\n')

test('inspect()', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('unist-util-inspect')).sort(), [
      'inspect',
      'inspectColor',
      'inspectNoColor'
    ])
  })

  await t.test('should work on `RootNode`', async function () {
    assert.equal(
      strip(inspect(retext().parse(paragraph))),
      [
        'RootNode[1] (1:1-1:36, 0-35)',
        '└─0 ParagraphNode[3] (1:1-1:36, 0-35)',
        '    ├─0 SentenceNode[6] (1:1-1:18, 0-17)',
        '    │   ├─0 WordNode[1] (1:1-1:5, 0-4)',
        '    │   │   └─0 TextNode "Some" (1:1-1:5, 0-4)',
        '    │   ├─1 WhiteSpaceNode " " (1:5-1:6, 4-5)',
        '    │   ├─2 WordNode[1] (1:6-1:12, 5-11)',
        '    │   │   └─0 TextNode "simple" (1:6-1:12, 5-11)',
        '    │   ├─3 WhiteSpaceNode " " (1:12-1:13, 11-12)',
        '    │   ├─4 WordNode[1] (1:13-1:17, 12-16)',
        '    │   │   └─0 TextNode "text" (1:13-1:17, 12-16)',
        '    │   └─5 PunctuationNode "." (1:17-1:18, 16-17)',
        '    ├─1 WhiteSpaceNode " " (1:18-1:19, 17-18)',
        '    └─2 SentenceNode[6] (1:19-1:36, 18-35)',
        '        ├─0 WordNode[1] (1:19-1:24, 18-23)',
        '        │   └─0 TextNode "Other" (1:19-1:24, 18-23)',
        '        ├─1 WhiteSpaceNode " " (1:24-1:25, 23-24)',
        '        ├─2 PunctuationNode "“" (1:25-1:26, 24-25)',
        '        ├─3 WordNode[1] (1:26-1:34, 25-33)',
        '        │   └─0 TextNode "sentence" (1:26-1:34, 25-33)',
        '        ├─4 PunctuationNode "”" (1:34-1:35, 33-34)',
        '        └─5 PunctuationNode "." (1:35-1:36, 34-35)'
      ].join('\n')
    )
  })

  await t.test('should work with a list of nodes', async function () {
    assert.equal(
      strip(
        inspect([u('SymbolNode', '$'), u('WordNode', [u('text', '5,00')])])
      ),
      '├─0 SymbolNode "$"\n└─1 WordNode[1]\n    └─0 text "5,00"'
    )
  })

  await t.test('should work on non-nodes', async function () {
    assert.doesNotThrow(function () {
      assert.equal(strip(inspect('foo')), '"foo"')
      assert.equal(strip(inspect(null)), 'null')
      assert.equal(strip(inspect(Number.NaN)), 'null')
      assert.equal(strip(inspect(3)), '3')
    })
  })

  await t.test('should align and indent large numbers', async function () {
    assert.equal(
      strip(
        inspect(
          Array.from({length: 11}).map(function (
            /** @type {undefined} */ d,
            i
          ) {
            return {
              type: 'text',
              value: String(i),
              data: {id: String.fromCodePoint(97 + i)}
            }
          })
        )
      ),
      [
        '├─0  text "0"',
        '│      data: {"id":"a"}',
        '├─1  text "1"',
        '│      data: {"id":"b"}',
        '├─2  text "2"',
        '│      data: {"id":"c"}',
        '├─3  text "3"',
        '│      data: {"id":"d"}',
        '├─4  text "4"',
        '│      data: {"id":"e"}',
        '├─5  text "5"',
        '│      data: {"id":"f"}',
        '├─6  text "6"',
        '│      data: {"id":"g"}',
        '├─7  text "7"',
        '│      data: {"id":"h"}',
        '├─8  text "8"',
        '│      data: {"id":"i"}',
        '├─9  text "9"',
        '│      data: {"id":"j"}',
        '└─10 text "10"',
        '       data: {"id":"k"}'
      ].join('\n')
    )
  })

  await t.test('should work with data attributes', async function () {
    assert.equal(
      strip(
        inspect({
          type: 'SymbolNode',
          value: '$',
          data: {test: true}
        })
      ),
      'SymbolNode "$"\n  data: {"test":true}'
    )
  })

  await t.test('should work with other attributes', async function () {
    assert.equal(
      strip(
        inspect({
          type: 'table',
          align: ['left', 'center'],
          children: [
            {
              type: 'tableRow',
              children: [
                {
                  type: 'tableCell',
                  children: [{type: 'text', value: 'foo'}]
                },
                {
                  type: 'tableCell',
                  children: [{type: 'text', value: 'bar'}]
                }
              ]
            },
            {
              type: 'tableRow',
              children: [
                {
                  type: 'tableCell',
                  children: [{type: 'text', value: 'baz'}]
                },
                {
                  type: 'tableCell',
                  children: [{type: 'text', value: 'qux'}]
                }
              ]
            }
          ]
        })
      ),
      [
        'table[2]',
        '│ align: ["left","center"]',
        '├─0 tableRow[2]',
        '│   ├─0 tableCell[1]',
        '│   │   └─0 text "foo"',
        '│   └─1 tableCell[1]',
        '│       └─0 text "bar"',
        '└─1 tableRow[2]',
        '    ├─0 tableCell[1]',
        '    │   └─0 text "baz"',
        '    └─1 tableCell[1]',
        '        └─0 text "qux"'
      ].join('\n')
    )
  })

  await t.test(
    'should work on parent nodes without children',
    async function () {
      assert.equal(
        strip(
          inspect({
            type: 'element',
            tagName: 'br',
            children: []
          })
        ),
        'element<br>[0]'
      )
    }
  )

  await t.test('should work on text nodes without value', async function () {
    assert.equal(strip(inspect({type: 'text', value: ''})), 'text ""')
  })

  await t.test('should work on void nodes', async function () {
    assert.equal(strip(inspect({type: 'thematicBreak'})), 'thematicBreak')
  })

  await t.test('should see properties as data', async function (t) {
    await t.test('should work', async function () {
      assert.equal(
        strip(inspect(h('button', {type: 'submit', value: 'Send'}))),
        [
          'element<button>[0]',
          '  properties: {"type":"submit","value":"Send"}'
        ].join('\n')
      )
    })

    await t.test('should see attributes as data', async function () {
      assert.equal(
        strip(inspect(x('album', {type: 'vinyl', id: '123'}))),
        'element<album>[0]\n  attributes: {"type":"vinyl","id":"123"}'
      )
    })

    await t.test('should see data as data', async function () {
      assert.equal(
        strip(inspect({type: 'node', data: {type: 'notNode'}})),
        'node\n  data: {"type":"notNode"}'
      )
    })

    await t.test('should handle nodes outside of children', async function () {
      assert.equal(
        strip(
          inspect(
            u(
              'jsxSpan',
              {
                open: u('jsxTag', {
                  close: false,
                  selfClosing: false,
                  name: u('jsxMember', {
                    object: u('jsxMember', {
                      object: u('jsxIdentifier', 'abc'),
                      property: u('jsxIdentifier', 'def')
                    }),
                    property: u('jsxIdentifier', 'ghi')
                  }),
                  attributes: [
                    u('jsxAttribute', {
                      name: u('jsxIdentifier', 'alpha'),
                      value: null
                    }),
                    u('jsxAttributeExpression', '...props'),
                    u('jsxAttribute', {
                      name: u('jsxIdentifier', 'bravo'),
                      value: null
                    })
                  ]
                }),
                close: u('jsxTag', {
                  close: true,
                  selfClosing: false,
                  name: u('jsxMember', {
                    object: u('jsxMember', {
                      object: u('jsxIdentifier', 'abc'),
                      property: u('jsxIdentifier', 'def')
                    }),
                    property: u('jsxIdentifier', 'ghi')
                  }),
                  attributes: []
                })
              },
              [u('jsxExpressionSpan', '1 + 1')]
            )
          )
        ),
        [
          'jsxSpan[1]',
          '│ open: jsxTag',
          '│   close: false',
          '│   selfClosing: false',
          '│   name: jsxMember',
          '│     object: jsxMember',
          '│       object: jsxIdentifier "abc"',
          '│       property: jsxIdentifier "def"',
          '│     property: jsxIdentifier "ghi"',
          '│   attributes:',
          '│   ├─0 jsxAttribute',
          '│   │     name: jsxIdentifier "alpha"',
          '│   ├─1 jsxAttributeExpression "...props"',
          '│   └─2 jsxAttribute',
          '│         name: jsxIdentifier "bravo"',
          '│ close: jsxTag',
          '│   close: true',
          '│   selfClosing: false',
          '│   name: jsxMember',
          '│     object: jsxMember',
          '│       object: jsxIdentifier "abc"',
          '│       property: jsxIdentifier "def"',
          '│     property: jsxIdentifier "ghi"',
          '│   attributes: []',
          '└─0 jsxExpressionSpan "1 + 1"'
        ].join('\n')
      )
    })
  })

  await t.test(
    'should work nodes of a certain kind (xast, hast)',
    async function () {
      assert.equal(
        strip(inspect(fromXml('<album id="123" />'))),
        [
          'root[1] (1:1-1:19, 0-18)',
          '└─0 element<album>[0] (1:1-1:19, 0-18)',
          '      attributes: {"id":"123"}'
        ].join('\n')
      )
    }
  )

  await t.test('should work without `offset` in `position`', async function () {
    assert.equal(
      strip(
        inspect({
          type: 'foo',
          value: 'foo\nbaar',
          position: {
            start: {line: 1, column: 1},
            end: {line: 2, column: 5}
          }
        })
      ),
      'foo "foo\\nbaar" (1:1-2:5)'
    )
  })

  await t.test(
    'should work without `start` and `end` in `position`',
    async function () {
      assert.equal(
        strip(
          inspect({
            type: 'foo',
            value: 'foo\nbaar',
            position: {}
          })
        ),
        'foo "foo\\nbaar"'
      )
    }
  )

  await t.test(
    'should work without `line` and `column` in `point`',
    async function () {
      assert.equal(
        strip(
          inspect({
            type: 'foo',
            value: 'foo\nbaar',
            position: {start: {}, end: {}}
          })
        ),
        'foo "foo\\nbaar" (1:1-1:1)'
      )
    }
  )

  await t.test(
    'should work with just `offset` in `position`',
    async function () {
      assert.equal(
        strip(
          inspect({
            type: 'foo',
            value: 'foo\nbaar',
            position: {
              start: {offset: 1},
              end: {offset: 8}
            }
          })
        ),
        'foo "foo\\nbaar" (1:1-1:1, 1-8)'
      )
    }
  )

  await t.test('should support `showPositions: false`', async function () {
    assert.equal(
      strip(inspect(retext().parse(paragraph), {showPositions: false})),
      [
        'RootNode[1]',
        '└─0 ParagraphNode[3]',
        '    ├─0 SentenceNode[6]',
        '    │   ├─0 WordNode[1]',
        '    │   │   └─0 TextNode "Some"',
        '    │   ├─1 WhiteSpaceNode " "',
        '    │   ├─2 WordNode[1]',
        '    │   │   └─0 TextNode "simple"',
        '    │   ├─3 WhiteSpaceNode " "',
        '    │   ├─4 WordNode[1]',
        '    │   │   └─0 TextNode "text"',
        '    │   └─5 PunctuationNode "."',
        '    ├─1 WhiteSpaceNode " "',
        '    └─2 SentenceNode[6]',
        '        ├─0 WordNode[1]',
        '        │   └─0 TextNode "Other"',
        '        ├─1 WhiteSpaceNode " "',
        '        ├─2 PunctuationNode "“"',
        '        ├─3 WordNode[1]',
        '        │   └─0 TextNode "sentence"',
        '        ├─4 PunctuationNode "”"',
        '        └─5 PunctuationNode "."'
      ].join('\n')
    )
  })

  await t.test('inspect(…, {colors: false})', async function () {
    assert.equal(
      lines(inspect(retext().parse(paragraph), {colors: false}), 2),
      [
        'RootNode[1] (1:1-1:36, 0-35)',
        '└─0 ParagraphNode[3] (1:1-1:36, 0-35)'
      ].join('\n')
    )
  })

  await t.test(
    'inspect(…, {colors?: true | null | undefined})',
    async function () {
      const expectedOutput = [
        chalkEnabled.bold('RootNode') +
          chalkEnabled.dim('[') +
          chalkEnabled.yellow('1') +
          chalkEnabled.dim(']') +
          ' ' +
          chalkEnabled.dim('(') +
          '1:1-1:36, 0-35' +
          chalkEnabled.dim(')'),
        chalkEnabled.dim('└─0') +
          ' ' +
          chalkEnabled.bold('ParagraphNode') +
          chalkEnabled.dim('[') +
          chalkEnabled.yellow('3') +
          chalkEnabled.dim(']') +
          ' ' +
          chalkEnabled.dim('(') +
          '1:1-1:36, 0-35' +
          chalkEnabled.dim(')')
      ].join('\n')

      const parsed = retext().parse(paragraph)

      assert.equal(lines(inspect(parsed, {colors: true}), 2), expectedOutput)
      assert.equal(lines(inspect(parsed, {colors: null}), 2), expectedOutput)
      assert.equal(
        lines(inspect(parsed, {colors: undefined}), 2),
        expectedOutput
      )
    }
  )
})

test('inspectNoColor()', async function () {
  assert.equal(
    inspectNoColor(retext().parse(paragraph)),
    [
      'RootNode[1] (1:1-1:36, 0-35)\n└─0 ParagraphNode[3] (1:1-1:36, 0-35)',
      '    ├─0 SentenceNode[6] (1:1-1:18, 0-17)',
      '    │   ├─0 WordNode[1] (1:1-1:5, 0-4)',
      '    │   │   └─0 TextNode "Some" (1:1-1:5, 0-4)',
      '    │   ├─1 WhiteSpaceNode " " (1:5-1:6, 4-5)',
      '    │   ├─2 WordNode[1] (1:6-1:12, 5-11)',
      '    │   │   └─0 TextNode "simple" (1:6-1:12, 5-11)',
      '    │   ├─3 WhiteSpaceNode " " (1:12-1:13, 11-12)',
      '    │   ├─4 WordNode[1] (1:13-1:17, 12-16)',
      '    │   │   └─0 TextNode "text" (1:13-1:17, 12-16)',
      '    │   └─5 PunctuationNode "." (1:17-1:18, 16-17)',
      '    ├─1 WhiteSpaceNode " " (1:18-1:19, 17-18)',
      '    └─2 SentenceNode[6] (1:19-1:36, 18-35)',
      '        ├─0 WordNode[1] (1:19-1:24, 18-23)',
      '        │   └─0 TextNode "Other" (1:19-1:24, 18-23)',
      '        ├─1 WhiteSpaceNode " " (1:24-1:25, 23-24)',
      '        ├─2 PunctuationNode "“" (1:25-1:26, 24-25)',
      '        ├─3 WordNode[1] (1:26-1:34, 25-33)',
      '        │   └─0 TextNode "sentence" (1:26-1:34, 25-33)',
      '        ├─4 PunctuationNode "”" (1:34-1:35, 33-34)',
      '        └─5 PunctuationNode "." (1:35-1:36, 34-35)'
    ].join('\n')
  )
})

test('inspectColor()', async function () {
  /** @type {NlcstRoot} */
  const root = retext().parse(paragraph)
  const p = root.children[0]
  assert(p.type === 'ParagraphNode')
  const sentence = p.children[0]
  assert(sentence.type === 'SentenceNode')

  assert.equal(
    inspectColor(sentence),
    [
      chalkEnabled.bold('SentenceNode') +
        chalkEnabled.dim('[') +
        chalkEnabled.yellow('6') +
        chalkEnabled.dim(']') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:1-1:18, 0-17' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('├─0') +
        ' ' +
        chalkEnabled.bold('WordNode') +
        chalkEnabled.dim('[') +
        chalkEnabled.yellow('1') +
        chalkEnabled.dim(']') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:1-1:5, 0-4' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('│') +
        '   ' +
        chalkEnabled.dim('└─0') +
        ' ' +
        chalkEnabled.bold('TextNode') +
        ' ' +
        chalkEnabled.green('"Some"') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:1-1:5, 0-4' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('├─1') +
        ' ' +
        chalkEnabled.bold('WhiteSpaceNode') +
        ' ' +
        chalkEnabled.green('" "') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:5-1:6, 4-5' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('├─2') +
        ' ' +
        chalkEnabled.bold('WordNode') +
        chalkEnabled.dim('[') +
        chalkEnabled.yellow('1') +
        chalkEnabled.dim(']') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:6-1:12, 5-11' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('│') +
        '   ' +
        chalkEnabled.dim('└─0') +
        ' ' +
        chalkEnabled.bold('TextNode') +
        ' ' +
        chalkEnabled.green('"simple"') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:6-1:12, 5-11' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('├─3') +
        ' ' +
        chalkEnabled.bold('WhiteSpaceNode') +
        ' ' +
        chalkEnabled.green('" "') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:12-1:13, 11-12' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('├─4') +
        ' ' +
        chalkEnabled.bold('WordNode') +
        chalkEnabled.dim('[') +
        chalkEnabled.yellow('1') +
        chalkEnabled.dim(']') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:13-1:17, 12-16' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('│') +
        '   ' +
        chalkEnabled.dim('└─0') +
        ' ' +
        chalkEnabled.bold('TextNode') +
        ' ' +
        chalkEnabled.green('"text"') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:13-1:17, 12-16' +
        chalkEnabled.dim(')'),
      chalkEnabled.dim('└─5') +
        ' ' +
        chalkEnabled.bold('PunctuationNode') +
        ' ' +
        chalkEnabled.green('"."') +
        ' ' +
        chalkEnabled.dim('(') +
        '1:17-1:18, 16-17' +
        chalkEnabled.dim(')')
    ].join('\n')
  )
})
