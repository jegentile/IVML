__author__ = 'jgentile'
import sys
import os
from ivml_documentation_from_file import IVMLDocumentationFromFile

def struct_to_latex(file,name,struct):
    file.write('\\clearpage \\noindent \\hrulefill\n')
    file.write('\\subsection*{{\\tt <'+name+'>}}\n')
    file.write('\\hrulefill\\newline\n')

    file.write(struct['description']+'\n')


    if (len(struct['ivml_required_attributes']) + len(struct['ivml_non_required_attributes'])) > 0:
        file.write('\\subsection*{\\emph{ivml attributes}}\n')
        file.write('\\begin{description}\n')
        for a in struct['ivml_required_attributes']:
            file.write('\\item[\uline{'+a+'}:]{'+struct['ivml_required_attributes'][a]+'}\n')
        for a in struct['ivml_non_required_attributes']:
            file.write('\\item['+a+':]{'+struct['ivml_non_required_attributes'][a]+'}\n')
        file.write('\\end{description}\n')

    if len(struct['svg_attributes']):
        file.write('\\subsection*{\\emph{svg attributes}}\n')
        file.write('\\begin{description}\n')
        for a in struct['svg_attributes']:
            file.write('\\item['+a+':]{'+struct['svg_attributes'][a]+'}\n')
        file.write('\\end{description}\n')

    if len(struct['event_attributes']):
        file.write('\\subsection*{\\emph{event attributes}}\n')
        file.write('\\begin{description}\n')
        for a in struct['event_attributes']:
            file.write('\\item['+a+':]{'+struct['event_attributes'][a]+'}\n')
        file.write('\\end{description}\n')




def main():
    argv = sys.argv
    path_to_IVML_visual_element_director = argv[1]
    print "Documentation generation started on: ",path_to_IVML_visual_element_director

    elements = {}
    file = open('manual.tex','w')


    for f in os.listdir(path_to_IVML_visual_element_director):
        if os.path.isfile(os.path.join(path_to_IVML_visual_element_director,f)):
            if '.js' in f:
                print '   file',f
                id = IVMLDocumentationFromFile(os.path.join(path_to_IVML_visual_element_director,f))
                id.parse()
                print 'Type: ',id.get_type()
                if not id.get_type() == 0:
                    if not elements.has_key(id.get_type()):
                        elements[id.get_type()] = {}
                    elements[id.get_type()][id.get_name()] = {'ivml_required_attributes':id.get_ivml_required_attributes(),
                                                              'ivml_non_required_attributes':id.get_ivml_non_required_attributes(),
                                                              'svg_attributes': id.get_svg_attributes(),
                                                              'event_attributes': id.get_event_attributes(),
                                                              'description': id.get_description()}
    print 'Wrapping up....'
    #print the charts
    if elements.has_key('chart'):
        print 'we have a chart'
        charts = elements['chart'].keys()
        print charts
        for c in charts:
            print c
            struct_to_latex(file,c,elements['chart'][c])

    if elements.has_key('visual_element'):
        print 'we have a visual_element'
        charts = elements['visual_element'].keys()
        print charts
        for c in charts:
            print c
            struct_to_latex(file,c,elements['visual_element'][c])

    if elements.has_key('group'):
        print 'we have a visual_element'
        charts = elements['group'].keys()
        print charts
        for c in charts:
            print c
            struct_to_latex(file,c,elements['group'][c])


    file.close()





if __name__ == '__main__':
    main()